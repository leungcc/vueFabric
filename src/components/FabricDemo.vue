

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
var rectScaling = function(){}

export default {
  name: 'FabricDemo',
  created() {
    mouseDown = this.canvasMouseDown.bind(this)
    mouseMove = this.canvasMouseMove.bind(this)
    mouseUp = this.canvasMouseUp.bind(this)
    rectSelected = this.rectSelected.bind(this)
    rectMoving = this.rectMoving.bind(this)
    rectScaling = this.rectScaling.bind(this)
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
      curActiveXcRect: {
        rect: null, //fabric.Rect
        minX: null, //number
        maxX: null  //number
      },

      xcTemp: null
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
      rect.on('scaling', rectScaling)
      
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
      if(this.polygons.length > 6) {
        return
      }

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

      //不允许创建 [负值] 的矩形
      if(this.curHandlingRect.width < 20) {
        this.curHandlingRect.set('width', 20)
        this.curHandlingRect.setCoords()
      }

      this.mainCanvas.renderAll()
      this.mainCanvas.discardActiveObject()

      setTimeout(() => {
        this.mainCanvas.setActiveObject(this.curHandlingRect)
        this.curHandlingRect = null
      }, 0)
    },

    rectSelected(e) {
      let target = null
      target = e.target || this.mainCanvas.getActiveObject() 
      console.log('rectSelected', target)

      this.lastOccupiedRect = null
      const { minX, maxX } = this.getMinMaxX(target)
      console.error(`minX=${minX}, maxX=${maxX}`)
      this.curActiveXcRect.rect = target
      this.curActiveXcRect.minX = minX
      this.curActiveXcRect.maxX = maxX
      this.curActiveXcRect.selectedLx = this.getRectLeftX(target) //选中时的 Lx
      this.curActiveXcRect.selectedRx = this.getRectRightX(target) //选中时的 Rx
    },

    rectMoving(e) {
      console.warn('[Event rectMoving]', e)
      const { minX, maxX } = this.curActiveXcRect
      
      if(!minX && !maxX) {
        throw new Error('sth error, minX&maxX both null')
      }
      const curRect = e.target
      const curRectLx = this.getRectLeftX(curRect)
      const curRectRx = this.getRectRightX(curRect)
      if(curRectLx <= minX) {
        this.setRectLeftWidth(
          curRect,
          minX,
          minX + Math.abs(curRect.width)*curRect.scaleX
        )
      } else if(curRectRx >= maxX) {
        this.setRectLeftWidth(
          curRect,
          maxX - Math.abs(curRect.width)*curRect.scaleX,
          maxX
        )
      }
    },

    rectScaling(e) {
      console.log('[rectScaling Event]', e)
      const { minX, maxX } = this.curActiveXcRect
      if(!minX && !maxX) {
        throw new Error('sth error, minX&maxX both null')
      }
      
      const curRect = e.target
      const curRectLx = this.getRectLeftX(curRect)
      const curRectRx = this.getRectRightX(curRect)
      
      let calcScaleX = curRect.scaleX
      let realWidth = Math.abs(curRect.width) * calcScaleX
      if(curRectLx-1 <= minX) {
        console.error(`报警！！！小于 minX:${minX}, curRect.width=${curRect.width}`)
        // realWidth = this.getRectRightX(curRect) - minX
        // calcScaleX = realWidth/curRect.width
        realWidth = this.xcTemp - minX
        calcScaleX = realWidth/curRect.width
        curRect.set('left', minX + 1)

      } else if(curRectRx+1 >= maxX) {
        realWidth = maxX - this.getRectLeftX(curRect) - 1
        calcScaleX = realWidth/curRect.width
      } else if(curRectLx > minX && curRectRx < maxX) {
        this.xcTemp = this.getRectRightX(curRect)
      }

      curRect.scaleX = calcScaleX
      curRect.setCoords()
      this.mainCanvas.renderAll()

      //改变 scaleX 不让它继续改变
      console.warn(`realWidth=${realWidth}, calcScaleX=${calcScaleX}`)
      console.error(e.target, `this.xcTemp=${this.xcTemp}`)
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
        console.log('getRectRightX', rect.left + rect.width*rect.scaleX)
        return parseInt(rect.left + rect.width*rect.scaleX)
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
        return parseInt(rect.left + rect.width*rect.scaleX)
      }
    },

    /**
     * @desc 获取一个图形的可移动最小x，与可移动最大x
     *        即找出相邻的两个图形
     * @param {fabric.Rect} rect
     * @return {{minX: number, maxX: number}
     */
    getMinMaxX(rect) {
      console.error('getMinMaxX', rect)
      let rectLX = this.getRectLeftX(rect)
      let rectRX = this.getRectRightX(rect)
      let leftRect = null
      let rightRect = null
      
      this.polygons.forEach(curRect => {
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
        minX: leftRect && this.getRectRightX(leftRect) + 1 || 0,
        maxX: rightRect && this.getRectLeftX(rightRect) - 1 || this.el_canvas.width
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
    },

    /**
     * @desc 设置一个rect的left和width
     * @param {fabric.Rect}
     * @param {number} lx 矩形左坐标
     * @param {number} rx 矩形右坐标
     */
    setRectLeftWidth(rect, lx, rx) {
      if(rect.width > 0) {
        rect.set('left', lx)
        rect.set('width', (rx - lx)/rect.scaleX)
      } else {
        rect.set('left', rx)
        rect.set('width', lx - rx)
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