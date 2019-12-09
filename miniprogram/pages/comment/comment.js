// pages/comment/comment.js
const db = wx.cloud.database(); //初始化数据库
Page({
    /**
     * 页面的初始数据
     */
    data: {
        commentShow: false,
        detail: {},
        content: "", //评价的内容
        score: 5,
        images: [],
        fileids: [],
        cardCur: 0,
        swiperList: [],
    },

    copy(event) {
        // console.log(event)
        wx.setClipboardData({
            data: event.target.dataset.copyurl,
            success() {
                wx.showToast({
                    title: '复制成功',
                    icon: 'success',
                    duration: 1000
                })
            }
        })
    },
    // ↓为轮播图函数体
    DotStyle(e) {
        this.setData({
            DotStyle: e.detail.value
        })
    },
    // cardSwiper
    cardSwiper(e) {
        this.setData({
            cardCur: e.detail.current
        })
    },
    // towerSwiper
    // 初始化towerSwiper
    towerSwiper(name) {
        /* let list = this.data.detail.casts.map(v => {
            return v.avatars
        }); */
        let list = this.data.detail.casts

        list = list.map(function(v, i, a) {
            v.myid = i
            return v
        });
        // console.log(list, "list")
        for (let i = 0; i < list.length; i++) {
            list[i].zIndex = parseInt(list.length / 2) + 1 - Math.abs(i - parseInt(list.length / 2))
            // console.log(list[i].zIndex, "list[i].zIndex")
            list[i].mLeft = i - parseInt(list.length / 2)
        }
        this.setData({
            swiperList: list
        })
    },
    // towerSwiper触摸开始
    towerStart(e) {
        this.setData({
            towerStart: e.touches[0].pageX
        })
    },
    // towerSwiper计算方向
    towerMove(e) {
        this.setData({
            direction: e.touches[0].pageX - this.data.towerStart > 0 ? 'right' : 'left'
        })
    },
    // towerSwiper计算滚动
    towerEnd(e) {
        let direction = this.data.direction;
        let list = this.data.swiperList;
        if (direction == 'right') {
            let mLeft = list[0].mLeft;
            let zIndex = list[0].zIndex;
            for (let i = 1; i < list.length; i++) {
                list[i - 1].mLeft = list[i].mLeft
                list[i - 1].zIndex = list[i].zIndex
            }
            list[list.length - 1].mLeft = mLeft;
            list[list.length - 1].zIndex = zIndex;
            this.setData({
                swiperList: list
            })
        } else {
            let mLeft = list[list.length - 1].mLeft;
            let zIndex = list[list.length - 1].zIndex;
            for (let i = list.length - 1; i > 0; i--) {
                list[i].mLeft = list[i - 1].mLeft
                list[i].zIndex = list[i - 1].zIndex
            }
            list[0].mLeft = mLeft;
            list[0].zIndex = zIndex;
            this.setData({
                swiperList: list
            })
        }
    },
    // ↑为轮播图函数体

    handleCommentShow: function(event) {
        this.setData({
            commentShow: !event.target.dataset.commentshow
        })
    },
    //跳转到电影详情页面
    gotoPlay: function(event) {
        wx.navigateTo({
            url: `../play/play?movieurl=${event.target.dataset.movieurl}`,
        })

    },

    submit: function() {
        wx.showLoading({
            title: "正在提交"
        });
        //上传图片到云存储
        let promiseArr = [];
        for (let i = 0; i < this.data.images.length; i++) {
            promiseArr.push(
                new Promise((resolve, reject) => {
                    let item = this.data.images[i];
                    // console.log(item, "item")
                    console.log(/\.\w+$/.exec(item), "item")
                    let suffix = /\.\w+$/.exec(item)[0]; //正则表达式,返回文件扩展名
                    wx.cloud.uploadFile({
                        cloudPath: new Date().getTime() + suffix, //上传至云端路径
                        filePath: item, //小程序临时文件路径
                        success: res => {
                            console.log(res.fileID)
                            this.setData({
                                fileids: this.data.fileids.concat(res.fileID)
                            });
                            resolve();
                        }
                    })
                })
            );
        }
        Promise.all(promiseArr).then(res => {
            // console.log(res)
            //插入数据
            db.collection("comment").add({
                data: {
                    content: this.data.content,
                    score: this.data.score,
                    movieid: this.data.movieid,
                    fileids: this.data.fileids
                }
            }).then(res => {
                wx.hideLoading();
                wx.showToast({
                    title: '发布成功',
                })
                this.setData({
                    content: "",
                    score: 5,
                    images: [],
                    fileids: []
                })
            }).catch(err => {
                wx.hideLoading();
                wx.showToast({
                    title: '发布失败!请重新提交!',
                })
            })
        });
    },

    onContentChange: function(event) {
        this.setData({
            content: event.detail
        });
    },
    onScoreChange: function(event) {
        this.setData({
            score: event.detail * 2
        });
    },

    //上传图片
    uploadImg: function() {
        //选择图片
        wx.chooseImage({
            count: 9,
            sizeType: ["original", "compressed"],
            sourceType: ["album", "camera"],
            success: res => {
                // tempFilePath可以作为img标签的src属性显示图片
                const tempFilePaths = res.tempFilePaths;
                console.log(tempFilePaths);
                this.setData({
                    images: this.data.images.concat(tempFilePaths)
                });
            }
        });

        /* wx.showLoading({
            title: '',
        }) */
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        this.setData({
            movieid: options.movieid
        })
        wx.showLoading({
            title: "加载中..."
        });
        console.log(options);
        wx.cloud
            .callFunction({
                name: "getDetail",
                data: {
                    movieid: options.movieid
                }
            })
            .then(res => {
                this.setData({
                    detail: JSON.parse(res.result)
                });
                wx.hideLoading();
                this.towerSwiper()
            })
            .catch(err => {
                console.log(err);
            });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {},

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {},

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function() {},

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {},

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {},

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {}
});