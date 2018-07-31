$(() => {
  'use strict';
  // 最初にjQueryのオブジェクトを全部作成
  // 大した負荷ではないが都度オブジェクトにすると時間がかかるため。
  // jQueryのオブジェクトの変数は$で始めている
  const $stage = $('#stage');
  const $title = $('.title');
  const $titleStart = $('.title__start');

  const $battle = $('.battle');
  const $battleMyhandGu = $('.battle__myhand-gu');
  const $battleMyhandChoki = $('.battle__myhand-choki');
  const $battleMyhandPa = $('.battle__myhand-pa');
  const $battleMyhandImages = $('.battle__myhand img');
  const $battleRound = $('.battle__round');
  const $battlePcHand = $('.battle__pchand');
  const $battleStatus = $('.battle__status');

  const $result = $('.result');
  const $resultShow = $('.result__show');
  const $resultImage = $('.result__image');
  const $resultWin = $('.result__win__count');
  const $resultPercentage = $('.result__winningPercentage');

  const $board = $('.board');
  const $boardRound = $('.board__round');
  const $boardResult = $('.board__result');
  const $boardWin = $('.board__win__count');
  const $boardWinningPercentage = $('.board__winningPercentage');
  const $nextStage = $('.next__stage');

  const $backToTitle = $('.back__toTitle');


  // Stage, Hands, Jankenはenumっぽくしてみたけど型がないとやっぱり厳しい・・・
  // ただ、方針として値を直に扱わないようにはなった。
  const Stage = Object.freeze({
    title: $title,
    battle: $battle,
    result: $result
  });

  const Hands = Object.freeze({
    gu: 0,
    choki: 1,
    pa: 2,
    get random() {
      return Math.trunc(Math.random() * 3)
    }
  });

  const Janken = Object.freeze({
    win: 2,
    lose: 1,
    draw: 0,
    /**
     * 勝敗判定
     * @param me
     * @param pc
     * @returns {number} 0: 引き分け, 1: 負け, 2: 勝ち
     */
    judgment(me, pc) {
      return (me - pc + 3) % 3
    }
  });
  // ------------------------------------------------------------

  // Vueでいうところのdataとcomputedまざったような・・・・
  const state = {
    _roundResults: [],
    _currentRound: 0,
    jankenImages: null,
    resultMessages: null,
    beginMessages: null,
    stage: null,
    get roundNum() {
      return this._roundResults.length
    },
    set currentRound(val) {
      if (!Number.isInteger(val) || val < 1 || val > this._roundResults.length) {
        throw Error('不正なラウンドを指定しました。')
      }
      this._currentRound = val
    },
    get currentRound() {
      return this._currentRound
    },
    get currentRoundResult() {
      return this._roundResults[this.currentRound - 1]
    },
    get gameNum() {
      return this.win + this.lose + this.draw
    },
    get winningPercentage() {
      return Math.trunc(this.win * 1000 / this.gameNum) / 10
    },
    get win() {
      return this._roundResults.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.win
      }, 0)
    },
    get lose() {
      return this._roundResults.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.lose
      }, 0)
    },
    get draw() {
      return this._roundResults.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.draw
      }, 0)
    },
    init(roundNum = 3) {
      this.stage = null;
      this._roundResults = [];
      this._currentRound = 0;
      this.jankenImages = null;
      for (let i = 0; i < roundNum; i++) {
        // 結果のオブジェクト
        let result = {
          win: 0,
          lose: 0,
          draw: 0,
          get gameNum() {
            return this.win + this.lose + this.draw
          },
          get winningPercentage() {
            return Math.trunc(this.win * 1000 / this.gameNum) / 10
          }
        };
        this._roundResults.push(result)
      }
    }
  };
  // DOMの操作は全部ここに集中させている
  // stateのsetでやるのも面白かったけど、ちょっとやってみたらコードが読みにくくなったので。
  const methods = {
    setStage(target) {
      if (!Object.values(Stage).includes(target)) {
        throw Error('不正なステージです。')
      }
      Object.keys(Stage).forEach((v) => {
        if (target === Stage[v]) {
          Stage[v].show();
          return
        }
        Stage[v].hide()
      });
      $stage.append(target.show());
      state.stage = target
    },
    flashToBoard(resultText) {
      $boardResult.text(resultText);
      $boardWin.text(state.currentRoundResult.win);
      $boardWinningPercentage.text(state.winningPercentage);
      $boardResult.addClass()
    },
    getPcHand() {
      return new Promise(resolve => {
        const id = setInterval(() => {
          $battlePcHand.attr('src', state.jankenImages[Hands.random])
        }, 10);
        setTimeout(() => {
          clearInterval(id);
          const pcHand = Hands.random;
          $battlePcHand.attr('src', state.jankenImages[pcHand]);
          resolve(pcHand)
        }, 1000)
      })
    },
    start (e) {
      e.preventDefault();
      state.init();
      methods.setStage(Stage.battle);
      methods.nextBattle();
      $battleMyhandImages.removeClass('selected')
    },
    async startJanken(myHand) {
      const pcHand = await this.getPcHand();
      $battleStatus.text('ポン！');
      return Janken.judgment(myHand, pcHand)
    },
    toResult(e) {
      e.preventDefault();
      $board.hide();
      methods.setStage(Stage.result);
      let resultImage = 'assets/images/award_green.png';
      if (state.winningPercentage >= 50) {
        resultImage = 'assets/images/award_gold.png'
      } else if (state.winningPercentage >= 40) {
        resultImage = 'assets/images/award_silver.png'
      }
      $resultShow.hide();
      $backToTitle.show();

      $resultImage.attr('src', resultImage);
      $resultWin.text(state.win);
      $resultPercentage.text(state.winningPercentage);
    },
    nextBattle() {
      state.currentRound += 1;
      $boardRound.text(`${state.currentRound}回戦`);
      $battleRound.text(`${state.currentRound}回戦`);
      state.jankenImages = jankenImages[Object.keys(jankenImages)[state.currentRound - 1]];
      state.resultMessages = resultMessages[Object.keys(resultMessages)[state.currentRound - 1]];
      state.beginMessages = beginMessages[Object.keys(beginMessages)[state.currentRound - 1]];
      $battleMyhandGu.data('hand', Hands.gu).attr('src', state.jankenImages[Hands.gu]);
      $battleMyhandChoki.data('hand', Hands.choki).attr('src', state.jankenImages[Hands.choki]);
      $battleMyhandPa.data('hand', Hands.pa).attr('src', state.jankenImages[Hands.pa]);
      $battlePcHand.attr('src', 'assets/images/mark_question.png');
      this.flashToBoard('');

      $board.hide();
      $nextStage.hide();
      $battleMyhandImages.removeClass('selected');
      $battleMyhandImages.removeClass('unselected');

      $battleStatus.text(state.beginMessages)
    },
    async janken(e) {
      $battleMyhandImages.removeClass('selected');
      $battleMyhandImages.addClass('unselected');
      const $target = $(e.currentTarget);
      $target.addClass('selected');
      const result = await methods.startJanken($target.data('hand'));
      if (result === Janken.win) {
        state.currentRoundResult.win += 1;
        methods.flashToBoard(state.resultMessages[Janken.win]);
        $boardResult.addClass("win")
      }
      if (result === Janken.lose) {
        state.currentRoundResult.lose += 1;
        methods.flashToBoard(state.resultMessages[Janken.lose]);
        $boardResult.addClass("lose")
      }
      if (result === Janken.draw) {
        state.currentRoundResult.draw += 1;
        methods.flashToBoard(state.resultMessages[Janken.draw]);
        $boardResult.addClass("draw")
      }

      await methods.sleep(2000);
      $board.show();
      if (state.currentRound < state.roundNum) {
        $nextStage.show();
      }
      else {
        $resultShow.show();
      }
    },
    sleep(ms){
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    reload(){
      location.reload(true);
    }
  };

  // ジャンケンのイメージ
  const jankenImages = {
    get janken() {
      const _ = {};
      _[Hands.gu] = 'assets/images/janken_gu.png';
      _[Hands.choki] = 'assets/images/janken_cho.png';
      _[Hands.pa] = 'assets/images/janken_pa.png';
      return _
    },
    get pokemon() {
      const _ = {};
      _[Hands.gu] = 'assets/images/pokemon_fushigidane.png';
      _[Hands.choki] = 'assets/images/pokemon_zenigame.png';
      _[Hands.pa] = 'assets/images/pokemon_hitokage.png';
      return _
    },
    get animal() {
      const _ = {};
      _[Hands.gu] = 'assets/images/animal_kaeru.png';
      _[Hands.choki] = 'assets/images/animal_namekuji.png';
      _[Hands.pa] = 'assets/images/animal_habu.png';
      return _
    }
  };

  // じゃんけん開始時メッセージ
  const beginMessages = {
    get janken(){
      return 'じゃんけん'
    },
    get pokemon(){
      return 'こうかばつぐんを狙え！'
    },
    get animal(){
      return 'いきのびろ！'
    }

  };

  // 結果メッセージ
  // ジャンケンのイメージ
  const resultMessages = {
    get janken() {
      const _ = {};
      _[Janken.win] = 'YOU WIN !!!';
      _[Janken.draw] = 'DRAW !!!';
      _[Janken.lose] = 'YOU LOSE...';
      return _
    },
    get pokemon() {
      const _ = {};
      _[Janken.win] = 'こうかはばつぐんだ！';
      _[Janken.draw] = 'こうかはいまひとつのようだ';
      _[Janken.lose] = 'こうかがないみたいだ...';
      return _
    },
    get animal() {
      const _ = {};
      _[Janken.win] = 'YOU SURVIVE!';
      _[Janken.draw] = 'BOTH DEAD...';
      _[Janken.lose] = 'YOU DEAD...';
      return _
    }
  };


  $titleStart.on('click', methods.start);
  $battleMyhandImages.on('click', methods.janken);
  $resultShow.on('click', methods.toResult);
  $backToTitle.on('click', methods.reload);
  $nextStage.on('click', (e) => {
    e.preventDefault();
    methods.setStage(Stage.battle);
    methods.nextBattle()
  });
  methods.setStage(Stage.title)
});
