

<template>
  <div id="main">
    <canvas 
      id="main-canvas" height="100"
    ></canvas>
  </div>
</template>

<script>
import { fabric } from 'fabric'

var mouseDown = function(){}
var mouseMove = function(){}
var mouseUp = function(){}
var rectSelected = function(){}
var rectMoving = function(){}

export default {
  name: 'FabricDemo',
  created() {
    mouseDown = this.canvasMouseDown.bind(this)
    mouseMove = this.canvasMouseMove.bind(this)
    mouseUp = this.canvasMouseUp.bind(this)
    rectSelected = this.rectSelected.bind(this)
    rectMoving = this.rectMoving.bind(this)
  },
  mounted() {
    this.createCanvas()
    // this.drawRect({
    //   left: 0,
    //   width: 50,
    // })

    this.drawRect({
      left: 200,
      width: 50,
    })
  },
  data() {
    return {
      el_canvas: null,
      mainCanvas: null,
      polygons: [],

      curCreatingInfoX: 0,
      curHandlingRect: null,
      lastOccupiedRect: null,

      curRectMinX: null, //moving 碰到左边块时产生
      curRectMax: null, //moving 碰到右边块时产生
    }
  },
  methods: {
    /**
     * @desc 创建画布
     */
    createCanvas() {
      const el_body = document.querySelector('body')
      this.el_canvas = document.querySelector('#main-canvas')
      this.el_canvas.width = el_body.clientWidth
      this.mainCanvas = new fabric.Canvas(this.el_canvas)
      this.mainCanvas.on('mouse:down', mouseDown)
    },

    /**
     * @desc 创建矩形
     */
    drawRect(options) {
      //默认参数
      const _DEFAULT_OPTIONS = {
        top: 0,
        height: 100,
        fill: '#86c5f2',
        opacity: 1,
        cornerStyle: 'circle',
        cornerSize: 8,
        borderColor: '#006EFF',
        cornerColor: '#006EFF',
        hasRotatingPoint: false,
        lockMovementY: true,
        lockScalingY: true,
      }
      options = {
        ..._DEFAULT_OPTIONS,
        ...options
      }

      //创建矩形
      var rect = new fabric.Rect(options)

      rect.on('selected', rectSelected)
      rect.on('moving', rectMoving)
      
      //隐藏 controller point
      rect.setControlsVisibility({
        mt: false, 
        mb: false, 
        bl: false,
        br: false, 
        tl: false, 
        tr: false,
        mtr: false,
      })
      this.polygons.push(rect)
      this.mainCanvas.add(rect)
      console.log('%c创建一个 rect', 'color: blue;')

      return rect
    },


    /**
     * @desc 画布鼠标点下事件
     */
    canvasMouseDown(e) {
      //如果该坐标已经属于某个 rect，不执行
      // if(this.isPosiOccupied(e.offsetX)) {
      //   return
      // }
      const eX = e.pointer.x

      if(this.mainCanvas.findTarget(e)) {
        console.warn('findTarget!!')
        return
      }

      //超过上限不再创建
      if(this.polygons.length)

      this.curCreatingInfoX = eX

      this.mainCanvas.on('mouse:move', mouseMove)
      this.mainCanvas.on('mouse:up', mouseUp)

      this.curHandlingRect = this.drawRect({
        left: eX,
        width: 1
      })
    },

    /**
     * @desc 画布上鼠标移动事件
     */
    canvasMouseMove(e) {
      // if(e.target.tagName !== 'CANVAS') {
      //   return
      // }

      //判断是否超出边界
      console.warn('[Event canvasMouseMove]', e)
      if(e.pointer.x > this.el_canvas.width) {
        e.pointer.x = this.el_canvas.width
      } else if(e.pointer.x < 0) {
        e.pointer.x = 0
      }

      //先判断移动后的坐标是否有冲突
      let eX = e.pointer.x

      //不允许反向添加
      if(eX < this.curCreatingInfoX) {
        eX = this.curCreatingInfoX
      }

      if(this.isPosiOccupied(eX + 1, true)) {
        console.error('拖到下一个object里面了')
        return
      }
      if(this.isPosiOccupied(eX - 1, true)) {
        console.error('拖到上一个object里面了')
        return
      }

      console.log('通过，当前x=', eX)
      this.curHandlingRect.setOptions({
        width: eX - this.curCreatingInfoX
      })
      this.curHandlingRect.setCoords()
      this.curHandlingRect.render(this.mainCanvas.getSelectionContext())

      
    },

    /**
     * @desc 画布上鼠标左键松起事件
     */
    canvasMouseUp() {
      console.warn('canvasMouseUp')
      this.mainCanvas.off('mouse:move', mouseMove)
      this.mainCanvas.off('mouse:up', mouseUp)

      if(this.curHandlingRect.width < 20) {
        this.curHandlingRect.set('width', 20)
        this.curHandlingRect.setCoords()
      }
      this.mainCanvas.renderAll()
      this.mainCanvas.discardActiveObject()

      setTimeout(() => {
        
        console.log(this.curHandlingRect)
        this.mainCanvas.setActiveObject(this.curHandlingRect)
        this.curHandlingRect = null
      }, 0)
    },

    rectSelected(e) {
      console.log('rectSelected', e)
      this.lastOccupiedRect = null
      this.curRectMinX = null
      this.curRectMaxX = null
    },

    rectMoving(e) {
      // console.warn('[Event rectMoving]', e)
      const curRect = this.mainCanvas.getActiveObject()
      console.error(curRect)
      const judgeLx = curRect.width > 0? curRect.left : curRect.width + curRect.left
      const judgeRx = curRect.width > 0? curRect.left + curRect.width : curRect.left
      console.log(`judgeLx=${judgeLx}, judgeRx=${judgeRx}`)

      let moveForward = e.e.movementX <= 0 ? 'left':'right'
      console.warn(`运动方向:${moveForward}`)

      //和上次的移动方向不一致，清除 lastOccupiedRect
      if(moveForward !== this.lastMoveForward) {
        this.lastOccupiedRect = null
      }

      //getBoundingRect()获得的 width 肯定是正数
      let lastOccupiedRectLeft = null
      let lastOccupiedRectRight = null
      if(this.lastOccupiedRect) {
        let lastOccupiedRectBoundingRect = this.lastOccupiedRect && this.lastOccupiedRect.getBoundingRect()
        lastOccupiedRectLeft = lastOccupiedRectBoundingRect.left
        lastOccupiedRectRight = lastOccupiedRectBoundingRect.left + lastOccupiedRectBoundingRect.width
      }

      //向左运动
      if(moveForward === 'left') {
        //碰到左边块
        if(
            ((lastOccupiedRectRight && judgeLx <= lastOccupiedRectRight) 
              || 
            this.isPosiOccupied(judgeLx - 1)
          )
          && (
            !this.curRectMaxX
              ||
            (this.curRectMaxX && curRect.left < this.curRectMaxX)
          )
          && (
            !this.curRectMaxX
              ||
            (this.curRectMaxX && this.getRectRightX(this.lastOccupiedRect) < this.curRectMaxX)
          )
        ) {
          const lastOccupiedRectRX = this.getRectRightX(this.lastOccupiedRect)
          console.error('碰到 [左] 块', `lastOccupiedRectRX=${lastOccupiedRectRX}`)
          this.curRectMinX = lastOccupiedRectRX + 1
          if(curRect.width > 0) {
            curRect.set('left', lastOccupiedRectRX + 1)
          } else {
            curRect.set('width', -(lastOccupiedRectRX - 1))
            curRect.set('left', lastOccupiedRectRX - curRect.width - 1)
          }
        }
      }

      //向右运动
      if(moveForward === 'right') {
        console.warn(`this.curRectMinX=${this.curRectMinX}, curRect.left=${curRect.left}`)
        //碰到右边块
        if((
            (lastOccupiedRectLeft && judgeRx >= lastOccupiedRectLeft) 
              ||
            this.isPosiOccupied(judgeRx + 1)
          )
          && (
            !this.curRectMinX 
              || 
            (this.curRectMinX && curRect.left > this.curRectMinX)
          )
          && (
            !this.curRectMinX
              ||
            (this.curRectMinX && this.getRectLeftX(this.lastOccupiedRect) - 1 > this.curRectMinX)
          )
        ) {
          const lastOccupiedRectLX = this.getRectLeftX(this.lastOccupiedRect)
          console.error('碰到 [右] 块', `curRect.left=${curRect.left}, this.curRectMinX=${this.curRectMinX}, curRectMaxX=${lastOccupiedRectLX - 1}`)
          this.curRectMaxX = lastOccupiedRectLX - 1
          if(curRect.width > 0) {
            curRect.set('left', lastOccupiedRectLX - curRect.width)
          } else {
            curRect.set('left', lastOccupiedRectLX - 1)
          }
        } else {
          // if(this.curRectMinX && curRectBoundingRect.left < this.curRectMinX)
        }
        
      }

      let curRectBoundingRect = curRect.getBoundingRect()
      console.log(`this.curRectMinX=${this.curRectMinX}, curRect.left=${curRect.left}`)
      //左右极限值
      if(this.curRectMinX) {
        if(curRect.width >= 0 && curRect.left < this.curRectMinX) {
          console.error('~~~太左了，给一个 curRectMinX 给你')
          curRect.set('left', this.curRectMinX)
          // curRect.setCoords()
        } else if(curRect.width < 0 && curRect.left < this.curRectMinX) {
          curRect.set('width', -curRectBoundingRect.width)
          curRect.set('left', this.curRectMinX + curRectBoundingRect.width)
        }
      }
      if(this.curRectMaxX) {
        if(curRect.width >= 0 && (curRect.left + curRect.width) > this.curRectMaxX) {
          console.error('~~~太右了，给一个 curRectMaxX 给你')
          curRect.set('left', this.curRectMaxX - curRect.width)
        } else if(curRect.width < 0 && curRect.left > this.curRectMaxX) {
          curRect.set('width', -curRectBoundingRect.width)
          curRect.set('left', this.curRectMaxX)
        }
      }

      //运动范围>0且小于画布宽度
      if(judgeRx >= this.el_canvas.width) {
        this.setRectLeftWidth(curRect, this.el_canvas.width - curRect.width, curRect.width)
      }

      curRect.setCoords()
      this.mainCanvas.renderAll()
      //记录上一次的运动方向
      this.lastMoveForward = e.e.movementX <= 0 ? 'left':'right'
    },

    /**
     * @desc 判断某个点是否被占用（选中的不判断）
     * @param {Number} x x坐标
     * @param {Boolean} isIgnoreLast 是否不检查最新那个 Rect
     */
    isPosiOccupied(x, isIgnoreLast) {
      let flag = false
      let curRect = this.mainCanvas.getActiveObject()

      //将所有点位 format2 {min:xxx, max:xxx} 这样的对象数组
      this.polygons.map((rect, index) => {
        if(curRect && curRect.left === rect.left && curRect.width === rect.width) {
          // console.error('死啦，不判断')
          return
        }
        var range = {
          min: rect.width > 0 ? rect.left : rect.left + rect.width,
          max: rect.width > 0 ? rect.left + rect.width : rect.left
        }
        if(!(isIgnoreLast && index === this.polygons.length - 1)) {
          if(x >= range.min && x <= range.max) {
            flag = true
            // occupiedObject = rect
            this.lastOccupiedRect = rect
          }
        } 
        return range
      })
      console.log(`isPosiOccupied, 判断x=${x}, 结果=${flag}`)
      return flag
    },

    getRectRightX(rect) {
      if(!rect) {
        return null
      }
      if(rect.width > 0) {
        return rect.left + rect.width
      } else {
        return rect.left
      }
    },

    getRectLeftX(rect) {
      if(!rect) {
        return null
      }
      if(rect.width > 0) {
        return rect.left
      } else {
        return rect.left + rect.width
      }
    },
    
    /**
     * @desc 解决问题：rect的width有正数和负数，负数时left是右边坐标
     * @param {fabric.rect} rect
     * @param {number} left 矩形左边坐标
     * @param {number} width left为左边时的矩形宽度
     */
    setRectLeftWidth(rect, left, width) {
      if(rect.width >= 0) {
        rect.set('left', left)
        rect.set('width', width)
      } else {
        rect.set('left', left + width)
        rect.set('width', -width)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
#main {
  width: 100%;
  height: 100px;
  border: 1px solid #ccc;
  #main-canvas {
    width: 100%;
    height: 100%;
  }
}
</style>