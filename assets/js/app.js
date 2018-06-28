$(() => {
  'use strict'
  // 最初にjQueryのオブジェクトを全部作成
  // 大した負荷ではないが都度オブジェクトにすると時間がかかるため。
  // jQueryのオブジェクトの変数は$で始めている
  const $stage = $('#stage')
  const $title = $('.title')
  const $titleStart = $('.title__start')

  const $battle = $('.battle')
  const $battleMyhandGu = $('.battle__myhand-gu')
  const $battleMyhandChoki = $('.battle__myhand-choki')
  const $battleMyhandPa = $('.battle__myhand-pa')
  const $battleMyhandImages = $('.battle__myhand img')
  const $battleNext = $('.battle__next')
  const $battleResult = $('.battle__result')
  const $battlePcHand = $('.battle__pchand')

  const $result = $('.result')
  const $resultRank = $('.result__rank')

  const $board = $('.board')
  const $boardRound = $('.board__round')
  const $boardResult = $('.board__result')
  const $boardWin = $('.board__win')
  const $boardLose = $('.board__lose')
  const $boardDraw = $('.board__draw')
  const $boardGameNum = $('.board__gameNum')
  const $boardWinningPercentage = $('.board__winningPercentage')
  const $total = $('.total')
  const $totalWin = $('.total__win')
  const $totalLose = $('.total__lose')
  const $totalDraw = $('.total__draw')
  const $totalGameNum = $('.total__gameNum')
  const $totalWinningPercentage = $('.total__winningPercentage')
  const $totalToTitle = $('.total__toTitle')

  // Stage, Hands, Jankenはenumっぽくしてみたけど型がないとやっぱり厳しい・・・
  // ただ、方針として値を直に扱わないようにはなった。
  const Stage = Object.freeze({
    title: $title,
    battle: $battle,
    result: $result
  })

  const Hands = Object.freeze({
    gu: 0,
    choki: 1,
    pa: 2,
    get random() {
      return Math.trunc(Math.random() * 3)
    }
  })

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
  })
  // ------------------------------------------------------------

  // Vueでいうところのdataとcomputedまざったような・・・・
  const state = {
    _roundResults: [],
    _currentRound: 0,
    jankenImages: null,
    stage: null,
    get roundNum () {
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
      this.stage = null
      this._roundResults = []
      this._currentRound = 0
      this.jankenImages = null
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
        }
        this._roundResults.push(result)
      }
    }
  }
  // DOMの操作は全部ここに集中させている
  // stateのsetでやるのも面白かったけど、ちょっとやってみたらコードが読みにくくなったので。
  const methods = {
    setStage(target) {
      if (!Object.values(Stage).includes(target)) {
        throw Error('不正なステージです。')
      }
      Object.keys(Stage).forEach((v) => {
        if (target === Stage[v]) {
          Stage[v].show()
          return
        }
        Stage[v].hide()
      })
      $stage.append(target.show())
      state.stage = target
    },
    flashToBoard(resultText) {
      $boardResult.text(resultText)
      $boardWin.text(state.currentRoundResult.win)
      $boardLose.text(state.currentRoundResult.lose)
      $boardDraw.text(state.currentRoundResult.draw)
      $boardGameNum.text(state.currentRoundResult.gameNum)
      $boardWinningPercentage.text(state.currentRoundResult.winningPercentage)
      $totalWin.text(state.win)
      $totalLose.text(state.lose)
      $totalDraw.text(state.draw)
      $totalGameNum.text(state.gameNum)
      $totalWinningPercentage.text(state.winningPercentage)
    },
    getPcHand() {
      return new Promise(resolve => {
        const id = setInterval(() => {
          $battlePcHand.attr('src', state.jankenImages[Hands.random])
        }, 10)
        setTimeout(() => {
          clearInterval(id)
          const pcHand = Hands.random
          $battlePcHand.attr('src', state.jankenImages[pcHand])
          resolve(pcHand)
        }, 1000)
      })
    },
    start (e) {
      e.preventDefault()
      state.init()
      methods.setStage(Stage.battle)
      methods.nextBattle()
      $battleMyhandImages.removeClass('selected')
      $board.show()
      $total.show()
    },
    async startJanken(myHand) {
      const pcHand = await this.getPcHand()
      return Janken.judgment(myHand, pcHand)
    },
    toResult(e) {
      e.preventDefault()
      if (state.gameNum < 10) {
        alert('累計10ゲーム以上行って下さい。')
        return
      }
      $board.hide()
      methods.setStage(Stage.result)
      let rank = 'グリーン'
      if (state.winningPercentage >= 50) {
        rank = 'ゴールド'
      } else if (state.winningPercentage >= 40) {
        rank = 'シルバー'
      }
      $resultRank.text(rank)
    },
    nextBattle() {
      state.currentRound += 1
      $boardRound.text(`${state.currentRound}回戦`)
      state.jankenImages = jankenImages[Object.keys(jankenImages)[state.currentRound - 1]]
      $battleMyhandGu.data('hand', Hands.gu).attr('src', state.jankenImages[Hands.gu])
      $battleMyhandChoki.data('hand', Hands.choki).attr('src', state.jankenImages[Hands.choki])
      $battleMyhandPa.data('hand', Hands.pa).attr('src', state.jankenImages[Hands.pa])
      $battlePcHand.attr('src', 'assets/images/mark_question.png')
      this.flashToBoard('')
      if (state.currentRound >= state.roundNum) {
        $battleNext.hide()
        $battleResult.show()
      } else {
        $battleNext.show()
        $battleResult.hide()
      }
    },
    async janken(e) {
      $battleMyhandImages.removeClass('selected')
      const $target = $(e.currentTarget)
      $target.addClass('selected')
      const result = await methods.startJanken($target.data('hand'))
      if (result === Janken.win) {
        state.currentRoundResult.win += 1
        methods.flashToBoard('勝ち')
      }
      if (result === Janken.lose) {
        state.currentRoundResult.lose += 1
        methods.flashToBoard('負け')
      }
      if (result === Janken.draw) {
        state.currentRoundResult.draw += 1
        methods.flashToBoard('あいこ')
      }
    }
  }

  // ジャンケンのイメージ
  const jankenImages = {
    get janken() {
      const _ = {}
      _[Hands.gu] = 'assets/images/janken_gu.png'
      _[Hands.choki] = 'assets/images/janken_cho.png'
      _[Hands.pa] = 'assets/images/janken_pa.png'
      return _
    },
    get pokemon() {
      const _ = {}
      _[Hands.gu] = 'assets/images/pokemon_fushigidane.png'
      _[Hands.choki] = 'assets/images/pokemon_zenigame.png'
      _[Hands.pa] = 'assets/images/pokemon_hitokage.png'
      return _
    },
    get animal() {
      const _ = {}
      _[Hands.gu] = 'assets/images/animal_kaeru.png'
      _[Hands.choki] = 'assets/images/animal_namekuji.png'
      _[Hands.pa] = 'assets/images/animal_habu.png'
      return _
    }
  }

  $titleStart.on('click', methods.start)
  $battleMyhandImages.on('click', methods.janken)
  $battleNext.on('click', (e) => {
    e.preventDefault()
    methods.nextBattle()
  })
  $battleResult.on('click', methods.toResult)
  $totalToTitle.on('click', (e) => {
    e.preventDefault()
    methods.setStage(Stage.title)
  })
  methods.setStage(Stage.title)
})
