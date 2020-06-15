

<template>
  <div id="main">
    <canvas 
      id="main-canvas" height="100"
    ></canvas>
  </div>
</template>

<script>
// import commUtils from '@/base/utils/commUtils'
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
      left: 100,
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

    }
  },
  methods: {
    /**
     * @desc 创建画布
     */
    createCanvas() {
      const el_body = document.querySelector('body')
      this.el_canvas = document.querySelector('#main-canvas')
      // this.el_canvas.width = el_body.clientWidth
      // this.el_canvas.setAttribute('width', el_body.clientWidth)
      this.mainCanvas = new fabric.Canvas(this.el_canvas)
      this.mainCanvas.on('mouse:down', mouseDown)
      console.warn(`this.el_canvas.width=${this.el_canvas.width}`)
      console.warn(`el_body.clientWidth=${el_body.clientWidth}`)
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
      const eX = e.pointer.x

      //如果该坐标已经属于某个 rect，不执行
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

      //判断是否超出边界
      console.warn('[Event canvasMouseMove]', e)
      if(e.pointer.x > this.el_canvas.width) {
        e.pointer.x = this.el_canvas.width
      } else if(e.pointer.x < 0) {
        e.pointer.x = 0
      }

      //先判断移动后的坐标是否有冲突
      const eX = e.pointer.x
      if(this.isPosiOccupied(eX + 1, true)) {
        console.error('拖到下一个object里面了')
        return
      }
      if(this.isPosiOccupied(eX - 1, true)) {
        console.error('拖到上一个object里面了')
        return
      }

      this.curHandlingRect.setOptions({
        width: eX - this.curCreatingInfoX
      })
      this.curHandlingRect.setCoords()
      this.curHandlingRect.render(this.mainCanvas.getSelectionContext())
      console.warn(eX - this.curCreatingInfoX)
      
    },

    /**
     * @desc 画布上鼠标左键松起事件
     */
    canvasMouseUp() {
      console.warn('canvasMouseUp')
      this.mainCanvas.off('mouse:move', mouseMove)
      this.mainCanvas.off('mouse:up', mouseUp)

      this.mainCanvas.renderAll()
      this.mainCanvas.discardActiveObject()

      setTimeout(() => {
        this.mainCanvas.setActiveObject(this.curHandlingRect)
        this.curHandlingRect = null
      }, 0)
    },

    rectSelected(e) {
      console.log('rectSelected', e)
      this.lastOccupiedRect = null
    },

    rectMoving(e) {
      console.warn('[Event rectMoving]', e)
      const { minX, maxX } = this.getMinMaxX(e.target)
      console.log(`minX=${minX}, maxX=${maxX}`)
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
     * @desc 获取一个图形的可移动最小x，与可移动最大x
     *        即找出相邻的两个图形
     * @param {fabric.Rect} rect
     * @return {{minX: number, maxX: number}
     */
    getMinMaxX(rect) {
      let rectLX = this.getRectLeftX(rect)
      let rectRX = this.getRectRightX(rect)
      let leftRect = null
      let rightRect = null
      
      this.polygons.forEach(curRect => {
        console.log(curRect)
        if(/* curRect.uuid === rect.uuid */this.isSameRect(curRect, rect)) {
          return
        }
        let curRectLX = this.getRectLeftX(curRect)
        let curRectRX = this.getRectRightX(curRect)
        if(curRectRX < rectLX) {
          if(leftRect) {
            leftRect = this.getRectRightX(leftRect) > curRectRX ? leftRect : curRect
          } else {
            leftRect = curRect
          }
        }
        if(curRectLX > rectRX) {
          if(rightRect) {
            rightRect = this.getRectLeftX(rightRect) < curRectLX ? rightRect : curRect
          } else {
            rightRect = curRect
          }
        }
      })

      return {
        minX: leftRect && this.getRectRightX(leftRect) || 0,
        maxX: rightRect && this.getRectLeftX(rightRect) || this.el_canvas.width
      }
    },

    /**
     * @desc 判断两个 rect 是否为同一个
     */
    isSameRect(rectA, rectB) {
      if(Math.abs(rectA.left - rectB.left) < 1 && Math.abs(rectA.width - rectB.width) < 1) {
        return true
      }
      return false
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