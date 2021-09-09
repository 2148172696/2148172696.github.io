import {max, sum} from './functions/util.js'
import {summary} from './functions/summary.js'
import Life from './life.js'

class App {
    constructor() {
        this.#life = new Life();
    }

    #life;
    #pages;
    #currentPage;
    #talentSelected = new Set();
    #totalMax = 10000;
    #isEnd = false;
    #selectedExtendTalent = null;
    #hintTimeout;

    async initial() {
        this.initPages();
        this.switch('loading');
        await this.#life.initial();
        this.switch('index');
        window.onerror = (event, source, lineno, colno, error) => {
            this.hint(`[ERROR] at (${source}:${lineno}:${colno})\n\n${error?.stack || error || 'unknow Error'}`, 'error');
        }
        const keyDownCallback = (keyboardEvent) => {
            if (keyboardEvent.which === 13 || keyboardEvent.keyCode === 13) {
                const pressEnterFunc = this.#pages[this.#currentPage]?.pressEnter;
                pressEnterFunc && typeof pressEnterFunc === 'function' && pressEnterFunc();
            }
        }
        window.removeEventListener('keydown', keyDownCallback);
        window.addEventListener('keydown', keyDownCallback);
    }

    initPages() {

        // Loading
        const loadingPage = $(`
        <div id="main">
            <div id="title">
                人生重开模拟器<br>
                <div style="font-size:1.5rem; font-weight:normal;">加载中...</div>
            </div>
        </div>
        `);

        // Index
        const indexPage = $(`
        <div id="main">
            <div id="cnt" class="head">已重开1次</div>
            <div id="onlinecnt" class="headonline">当前在线：0人</div>
            <button id="rank">排行榜</button>
            <button id="themeToggleBtn">黑</button>
            <div id="title">
                人生重开模拟器<br>
                <div style="font-size:1.5rem; font-weight:normal;">这垃圾人生一秒也不想呆了</div>
                <div style="font-size:0.5rem; font-weight:normal;">&nbsp;</div>
				<div style="font-size:1rem; font-weight:normal;"><a href="https://liferestart.syaro.io/view/">原版-></a></div>
				<div style="font-size:1rem; font-weight:normal;"><a href="https://github.com/VickScarlet/lifeRestart">原版Github-></a></div>
				<div style="font-size:1rem; font-weight:normal;"><a id="modify" href="#">改动-></a></div>
            </div>
            <button id="restart" class="mainbtn"><span class="iconfont">&#xe6a7;</span>立即重开</button>
        </div>
        `);

        // Init theme
        this.setTheme(localStorage.getItem('theme'));

        indexPage
            .find('#restart')
            .click(() => {
                this.switch('talent');
                $('#github-cor').hide();
            });

        indexPage
            .find('#rank')
            .click(() => this.hint('别卷了！没有排行榜'));

        if (localStorage.getItem('theme') == 'light') {
            indexPage.find('#themeToggleBtn').text('黑')
        } else {
            indexPage.find('#themeToggleBtn').text('白')
        }

        indexPage
            .find('#modify')
            .click(() => this.hint('此版本修改：\n- 限制10000初始属性\n- 不强制全部使用+无限刷新天赋\n- 可自选全部天赋\n- 可以两种速度快进人生'));

        indexPage
            .find("#themeToggleBtn")
            .click(() => {
                if (localStorage.getItem('theme') == 'light') {
                    localStorage.setItem('theme', 'dark');
                    indexPage.find('#themeToggleBtn').text('白');
                } else {
                    localStorage.setItem('theme', 'light');
                    indexPage.find('#themeToggleBtn').text('黑');
                }

                this.setTheme(localStorage.getItem('theme'));
            });

        // Talent
        const talentPage = $(`
        <div id="main">
            <div class="head" style="font-size: 1.6rem">天赋抽卡</div>
            <ul id="talents" class="selectlist"></ul>
            <div class="btn-area">
                <button id="random" class="mainbtn">10连抽！</button>
                <button id="listall" class="mainbtn">显示全部</button>
            </div>
            <button id="next" class="mainbtn">请选择3个</button>
        </div>
        `);

        const createTalent = ({grade, name, description}) => {
            return $(`<li class="grade${grade}b">${name}（${description}）</li>`);
        };

        talentPage
            .find('#random')
            .click(() => {
                const ul = talentPage.find('#talents');
                ul.html('');
                this.#talentSelected.clear();
                talentPage.find('#next').text('请选择3个');
                this.#life.talentRandom()
                    .forEach(talent => {
                        const li = createTalent(talent);
                        ul.append(li);
                        li.click(() => {
                            if (li.hasClass('selected')) {
                                li.removeClass('selected');
                                this.#talentSelected.delete(talent);
                                if (this.#talentSelected.size < 3) {
                                    talentPage.find('#next').text('请选择3个');
                                }
                            } else {
                                if (this.#talentSelected.size == 3) {
                                    this.hint('只能选3个天赋');
                                    return;
                                }

                                const exclusive = this.#life.exclusive(
                                    Array.from(this.#talentSelected).map(({id}) => id),
                                    talent.id
                                );
                                if (exclusive != null) {
                                    for (const {name, id} of this.#talentSelected) {
                                        if (id == exclusive) {
                                            this.hint(`与已选择的天赋【${name}】冲突`);
                                            return;
                                        }
                                    }
                                    return;
                                }
                                li.addClass('selected');
                                this.#talentSelected.add(talent);
                                if (this.#talentSelected.size == 3) {
                                    talentPage.find('#next').text('开始新人生')
                                }
                            }
                        });
                    });
                talentPage.find('#next').show();
            });

        talentPage
            .find('#listall')
            .click(() => {
                const ul = talentPage.find('#talents');
                talentPage.find('#random').hide();
                talentPage.find('#listall').hide();
                ul.html('');
                talentPage.find('#next').text('请选择3个');
                this.#life.talentAll()
                    .forEach(talent => {
                        const li = createTalent(talent);
                        ul.append(li);
                        this.#talentSelected.clear();
                        li.click(() => {
                            if (li.hasClass('selected')) {
                                li.removeClass('selected')
                                li.removeClass('selected')
                                this.#talentSelected.delete(talent);
                                if (this.#talentSelected.size < 3) {
                                    talentPage.find('#next').text('请选择3个');
                                }
                            } else {
                                if (this.#talentSelected.size == 3) {
                                    this.hint('只能选3个天赋');
                                    return;
                                }

                                const exclusive = this.#life.exclusive(
                                    Array.from(this.#talentSelected).map(({id}) => id),
                                    talent.id
                                );
                                if (exclusive != null) {
                                    for (const {name, id} of this.#talentSelected) {
                                        if (id == exclusive) {
                                            this.hint(`与已选择的天赋【${name}】冲突`);
                                            return;
                                        }
                                    }
                                    return;
                                }
                                li.addClass('selected');
                                this.#talentSelected.add(talent);
                                if (this.#talentSelected.size == 3) {
                                    talentPage.find('#next').text('开始新人生')
                                }
                            }
                        });
                    });
                talentPage.find('#next').show()
            });

        talentPage
            .find('#next')
            .click(() => {
                if (this.#talentSelected.size != 3) {
                    this.hint('请选择3个天赋');
                    return;
                }
                this.#totalMax = 10000 + this.#life.getTalentAllocationAddition(Array.from(this.#talentSelected).map(({id}) => id));
                this.switch('property');
            })

        // Property
        // hint of extension tobermory.es6-string-html
        const propertyPage = $(/*html*/`
        <div id="main">
            <div class="head" style="font-size: 1.6rem">
                <div>调整初始属性</div>
                <div id="total" style="font-size:1rem; font-weight:normal;">可用属性点：0</div>
            </div>
            <ul id="propertyAllocation" class="propinitial"></ul>
            <ul class="selectlist" id="talentSelectedView"></ul>
            <div class="btn-area">
                <button id="random" class="mainbtn">随机分配</button>
                <button id="start" class="mainbtn">开始新人生</button>
            </div>
        </div>
        `);
        propertyPage.mounted = () => {
            propertyPage
                .find('#talentSelectedView').append(
                `<li>已选天赋</li>` +
                Array.from(this.#talentSelected)
                    .map(({name, description}) => `<li class="grade0b">${name}(${description})</li>`)
                    .join('')
            )
        }
        const groups = {};
        const total = () => {
            let t = 0;
            for (const type in groups)
                t += groups[type].get();
            return t;
        }
        const freshTotal = () => {
            propertyPage.find('#total').text(`可用属性点：${this.#totalMax - total()}`);
        }
        const getBtnGroups = (name, min, max) => {
            const group = $(`<li>${name}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</li>`);
            const btnSub = $(`<span class="iconfont propbtn">&#xe6a5;</span>`);
            const inputBox = $(`<input value="0">`);
            const btnAdd = $(`<span class="iconfont propbtn">&#xe6a6;</span>`);
            group.append(btnSub);
            group.append(inputBox);
            group.append(btnAdd);

            const limit = v => {
                v = Number(v) || 0;
                v = Math.round(v);
                return v < min ? min : (
                    v > max ? max : v
                )
            }
            const get = () => Number(inputBox.val());
            const set = v => {
                inputBox.val(limit(v));
                freshTotal();
            }
            btnAdd.click(() => {
                if (total() >= this.#totalMax) {
                    this.hint('没有可分配的点数了');
                    return;
                }
                set(get() + 1);
            });
            btnSub.click(() => set(get() - 1));
            inputBox.on('input', () => {
                const t = total();
                let val = get();
                if (t > this.#totalMax) {
                    val -= t - this.#totalMax;
                }
                val = limit(val);
                if (val != inputBox.val()) {
                    set(val);
                }
                freshTotal();
            });
            return {group, get, set};
        }

        groups.CHR = getBtnGroups("颜值", 0, 2500); // 颜值 charm CHR
        groups.INT = getBtnGroups("智力", 0, 2500); // 智力 intelligence INT
        groups.STR = getBtnGroups("体质", 0, 2500); // 体质 strength STR
        groups.MNY = getBtnGroups("家境", 0, 2500); // 家境 money MNY

        const ul = propertyPage.find('#propertyAllocation');

        for (const type in groups) {
            ul.append(groups[type].group);
        }

        propertyPage
            .find('#random')
            .click(() => {
                let t = this.#totalMax;
                const arr = [10000, 10000, 10000, 10000];
                while (t > 0) {
                    const sub = Math.round(Math.random() * (Math.min(t, 2500) - 1)) + 1;
                    while (true) {
                        const select = Math.floor(Math.random() * 4) % 4;
                        if (arr[select] - sub < 0) continue;
                        arr[select] -= sub;
                        t -= sub;
                        break;
                    }
                }
                groups.CHR.set(10000 - arr[0]);
                groups.INT.set(10000 - arr[1]);
                groups.STR.set(10000 - arr[2]);
                groups.MNY.set(10000 - arr[3]);
            });

        propertyPage
            .find('#start')
            .click(() => {
                if (total() > this.#totalMax) {
                    this.hint(`你多使用了${total() - this.#totalMax}属性点`);
                    return;
                }
                this.#life.restart({
                    CHR: groups.CHR.get(),
                    INT: groups.INT.get(),
                    STR: groups.STR.get(),
                    MNY: groups.MNY.get(),
                    SPR: 5,
                    TLT: Array.from(this.#talentSelected).map(({id}) => id),
                });
                this.switch('trajectory');
                this.#pages.trajectory.born();
                // $(document).keydown(function(event){
                //     if(event.which == 32 || event.which == 13){
                //         $('#lifeTrajectory').click();
                //     }
                // })
            });

        // Trajectory
        const trajectoryPage = $(`
        <div id="main">
            <ul id="lifeProperty" class="lifeProperty"></ul>
            <ul id="lifeTrajectory" class="lifeTrajectory"></ul>
            <div class="btn-area">
                <button id="skip-slow" class="mainbtn">></button>
                <button id="skip-fast" class="mainbtn">>></button>
                <button id="stop-skip" class="mainbtn" style="display: none;">停止</button>
                <button id="summary" class="mainbtn">人生总结</button>
                <button id="domToImage" class="mainbtn">人生回放</button>
            </div>
            <div class="domToImage2wx">
                <img src="" id="endImage" />
            </div>
        </div>
        `);

        let t1 = null;
        let t2 = null;
        trajectoryPage
            .find('#lifeTrajectory')
            .click(() => {
                if (this.#isEnd) {
                    window.clearInterval(t1);
                    window.clearInterval(t2);
                    t1 = null;
                    t2 = null;
                    trajectoryPage.find('#skip-slow').hide();
                    trajectoryPage.find('#skip-fast').hide();
                    trajectoryPage.find('#stop-skip').hide();
                    return;
                }
                const trajectory = this.#life.next();
                const {age, content, isEnd} = trajectory;
                const li = $(`<li><span>${age}岁：</span><span>${
                    content.map(
                        ({type, description, grade, name, postEvent}) => {
                            switch (type) {
                                case 'TLT':
                                    return `天赋【${name}】发动：${description}`;
                                case 'EVT':
                                    return description + (postEvent ? `<br>${postEvent}` : '');
                            }
                        }
                    ).join('<br>')
                }</span></li>`);
                li.appendTo('#lifeTrajectory');
                $("#lifeTrajectory").scrollTop($("#lifeTrajectory")[0].scrollHeight);
                if (isEnd) {
                    $(document).unbind("keydown");
                    this.#isEnd = true;
                    trajectoryPage.find('#summary').show();
                    trajectoryPage.find('#domToImage').show();
                    trajectoryPage.find('#skip-slow').hide();
                    trajectoryPage.find('#skip-fast').hide();
                } else {
                    // 如未死亡，更新数值
                    // Update properties if not die yet
                    const property = this.#life.getLastRecord();
                    $("#lifeProperty").html(`
                    <li><span>颜值</span><span>${property.CHR}</span></li>
                    <li><span>智力</span><span>${property.INT}</span></li>
                    <li><span>体质</span><span>${property.STR}</span></li>
                    <li><span>家境</span><span>${property.MNY}</span></li>
                    <li><span>快乐</span><span>${property.SPR}</span></li>
                    `);
                }
            });
        // html2canvas
        trajectoryPage
            .find('#domToImage')
            .click(() => {
                window.clearInterval(t1);
                window.clearInterval(t2);
                if (this.#isEnd) {
                    trajectoryPage.find('#skip-slow').hide()
                    trajectoryPage.find('#skip-fast').hide()
                    trajectoryPage.find('#stop-skip').hide()
                }else {
                    trajectoryPage.find('#skip-slow').show()
                    trajectoryPage.find('#skip-fast').show()
                    trajectoryPage.find('#stop-skip').hide()
                }
                $("#lifeTrajectory").addClass("deleteFixed");
                const ua = navigator.userAgent.toLowerCase();
                domtoimage.toJpeg(document.getElementById('lifeTrajectory'))
                    .then(function (dataUrl) {
                        let link = document.createElement('a');
                        link.download = '我的人生回放.jpeg';
                        link.href = dataUrl;
                        link.click();
                        $("#lifeTrajectory").removeClass("deleteFixed");
                        // 微信内置浏览器，显示图片，需要用户单独保存
                        if (ua.match(/MicroMessenger/i) == "micromessenger") {
                            $('#endImage').attr('src', dataUrl);
                        }
                    });
            })

        trajectoryPage
            .find('#summary')
            .click(() => {
                trajectoryPage.find('#skip-slow').show();
                trajectoryPage.find('#skip-fast').show();
                trajectoryPage.find('#stop-skip').hide();
                this.switch('summary');
            })

        trajectoryPage
            .find('#skip-slow')
            .click(() => {
                if (this.#isEnd) {
                    this.hint("人生已经结束了哦~");
                    return;
                }
                trajectoryPage.find('#skip-slow').hide();
                trajectoryPage.find('#skip-fast').hide();
                trajectoryPage.find('#stop-skip').show();
                t1 = setInterval("$('#lifeTrajectory').click();", 500);
            })

        trajectoryPage
            .find('#skip-fast')
            .click(() => {
                if (this.#isEnd) {
                    this.hint("人生已经结束了哦~");
                    return;
                }
                trajectoryPage.find('#skip-slow').hide()
                trajectoryPage.find('#skip-fast').hide()
                trajectoryPage.find('#stop-skip').show()
                t1 = setInterval("$('#lifeTrajectory').click();", 100);
            })

        trajectoryPage
            .find('#stop-skip')
            .click(() => {
                trajectoryPage.find('#skip-slow').show()
                trajectoryPage.find('#skip-fast').show()
                trajectoryPage.find('#stop-skip').hide()
                window.clearInterval(t1);
                window.clearInterval(t2);
                t1 = null;
                t2 = null;
            })

        // Summary
        const summaryPage = $(`
        <div id="main">
            <div class="head">人生总结</div>
            <ul id="judge" class="judge">
                <li class="grade2"><span>颜值：</span><span>9级 美若天仙</span></li>
                <li class="grade0"><span>智力：</span><span>4级 智力一般</span></li>
                <li class="grade0"><span>体质：</span><span>1级 极度虚弱</span></li>
                <li class="grade0"><span>家境：</span><span>6级 小康之家</span></li>
                <li class="grade0"><span>享年：</span><span>3岁 早夭</span></li>
                <li class="grade0"><span>快乐：</span><span></span>3级 不太幸福的人生</li>
            </ul>
            <div class="head" style="height:auto;">天赋，你可以选一个，下辈子还能抽到</div>
            <ul id="talents" class="selectlist" style="flex: 0 1 auto;">
                <li class="grade2b">黑幕（面试一定成功）</li>
            </ul>
            <button id="again" class="mainbtn"><span class="iconfont">&#xe6a7;</span>再次重开</button>
        </div>
        `);

        summaryPage
            .find('#again')
            .click(() => {
                this.times++;
                this.#life.talentExtend(this.#selectedExtendTalent);
                this.#selectedExtendTalent = null;
                this.#talentSelected.clear();
                this.#totalMax = 10000;
                this.#isEnd = false;
                indexPage.find('#github-cor').show();
                this.switch('index');
            });

        this.#pages = {
            loading: {
                page: loadingPage,
                clear: () => {
                    this.#currentPage = 'loading';
                },
            },
            index: {
                page: indexPage,
                btnRank: indexPage.find('#rank'),
                btnRestart: indexPage.find('#restart'),
                hint: indexPage.find('.hint'),
                cnt: indexPage.find('#cnt'),
                pressEnter: () => {
                    this.#pages.index.btnRestart.click();
                },
                clear: () => {
                    this.#currentPage = 'index';
                    indexPage.find('.hint').hide();

                    const times = this.times;
                    const btnRank = indexPage.find('#rank');
                    const cnt = indexPage.find('#cnt');
                    if (times > 0) {
                        btnRank.show();
                        cnt.show();
                        cnt.text(`已重开${times}次`);
                        return;
                    }

                    btnRank.hide();
                    cnt.hide();
                },
            },
            talent: {
                page: talentPage,
                talentList: talentPage.find('#talents'),
                btnRandom: talentPage.find('#random'),
                btnNext: talentPage.find('#next'),
                pressEnter: () => {
                    const talentList = this.#pages.talent.talentList;
                    const btnRandom = this.#pages.talent.btnRandom;
                    const btnNext = this.#pages.talent.btnNext;
                    if (talentList.children().length) {
                        btnNext.click();
                    } else {
                        btnRandom.click();
                    }
                },
                clear: () => {
                    this.#currentPage = 'talent';
                    talentPage.find('ul.selectlist').empty();
                    talentPage.find('#random').show();
                    talentPage.find('#listall').show();
                    this.#totalMax = 10000;
                },
            },
            property: {
                page: propertyPage,
                btnStart: propertyPage.find('#start'),
                pressEnter: () => {
                    this.#pages.property.btnStart.click();
                },
                clear: () => {
                    this.#currentPage = 'property';
                    freshTotal();
                    propertyPage
                        .find('#talentSelectedView')
                        .empty();
                },
            },
            trajectory: {
                page: trajectoryPage,
                lifeTrajectory: trajectoryPage.find('#lifeTrajectory'),
                pressEnter: () => {
                    this.#pages.trajectory.lifeTrajectory.click();
                },
                clear: () => {
                    this.#currentPage = 'trajectory';
                    trajectoryPage.find('#lifeTrajectory').empty();
                    trajectoryPage.find('#summary').hide();
                    this.#isEnd = false;
                },
                born: () => {
                    trajectoryPage.find('#lifeTrajectory').trigger("click");
                }
            },
            summary: {
                page: summaryPage,
                clear: () => {
                    this.#currentPage = 'summary';
                    const judge = summaryPage.find('#judge');
                    const talents = summaryPage.find('#talents');
                    judge.empty();
                    talents.empty();
                    this.#talentSelected.forEach(talent => {
                        const li = createTalent(talent);
                        talents.append(li);
                        li.click(() => {
                            if (li.hasClass('selected')) {
                                this.#selectedExtendTalent = null;
                                li.removeClass('selected');
                            } else if (this.#selectedExtendTalent != null) {
                                this.hint('只能继承一个天赋');
                                return;
                            } else {
                                this.#selectedExtendTalent = talent.id;
                                li.addClass('selected');
                            }
                        });
                    });

                    const records = this.#life.getRecord();
                    const s = (type, func) => {
                        const value = func(records.map(({[type]: v}) => v));
                        const {judge, grade} = summary(type, value);
                        return {judge, grade, value};
                    };

                    judge.append([
                        (() => {
                            const {judge, grade, value} = s('CHR', max);
                            return `<li class="grade${grade}"><span>颜值：</span><span>${value} ${judge}</span></li>`
                        })(),
                        (() => {
                            const {judge, grade, value} = s('INT', max);
                            return `<li class="grade${grade}"><span>智力：</span><span>${value} ${judge}</span></li>`
                        })(),
                        (() => {
                            const {judge, grade, value} = s('STR', max);
                            return `<li class="grade${grade}"><span>体质：</span><span>${value} ${judge}</span></li>`
                        })(),
                        (() => {
                            const {judge, grade, value} = s('MNY', max);
                            return `<li class="grade${grade}"><span>家境：</span><span>${value} ${judge}</span></li>`
                        })(),
                        (() => {
                            const {judge, grade, value} = s('SPR', max);
                            return `<li class="grade${grade}"><span>快乐：</span><span>${value} ${judge}</span></li>`
                        })(),
                        (() => {
                            const {judge, grade, value} = s('AGE', max);
                            return `<li class="grade${grade}"><span>享年：</span><span>${value} ${judge}</span></li>`
                        })(),
                        (() => {
                            const m = type => max(records.map(({[type]: value}) => value));
                            const value = Math.floor(sum(m('CHR'), m('INT'), m('STR'), m('MNY'), m('SPR')) * 2 + m('AGE') / 2);
                            const {judge, grade} = summary('SUM', value);
                            return `<li class="grade${grade}"><span>总评：</span><span>${value} ${judge}</span></li>`
                        })(),
                    ].join(''));
                }
            },
        }
    }

    switch(page) {
        const p = this.#pages[page];
        if (!p) return;
        $('#main').detach();
        p.clear();
        p.page.appendTo('body');
        if (typeof p.page.mounted === 'function') {
            p.page.mounted()
        }
    }

    hint(message, type = 'info') {
        if (this.#hintTimeout) {
            clearTimeout(this.#hintTimeout);
            this.#hintTimeout = null;
        }
        hideBanners();
        requestAnimationFrame(() => {
            const banner = $(`.banner.${type}`);
            banner.addClass('visible');
            banner.find('.banner-message').text(message);
            if (type != 'error') {
                this.#hintTimeout = setTimeout(hideBanners, 3000);
            }
        });
    }

    setTheme(theme) {
        const themeLink = $(document).find('#themeLink');

        if (theme == 'light') {
            themeLink.attr('href', 'light.css');
        } else {
            themeLink.attr('href', 'dark.css');
        }
    }

    get times() {
        return this.#life?.times || 0;
    }

    set times(v) {
        if (this.#life) this.#life.times = v
    };

}

export default App;
