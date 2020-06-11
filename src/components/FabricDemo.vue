

<template>
  <div id="main">
    <canvas 
      id="main-canvas" 
      width="400" height="100"
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
    this.drawRect({
      left: 0,
      width: 50,
    })

    this.drawRect({
      left: 100,
      width: 50,
    })
  },
  data() {
    return {
      mainCanvas: null,
      polygons: [],
      curCreatingInfo: {
        x: 0, y: 0
      },
      curHandlingRect: null,
      lastOccupiedRect: null
    }
  },
  methods: {
    /**
     * @desc 创建画布
     */
    createCanvas() {
      this.mainCanvas = new fabric.Canvas(document.querySelector('#main-canvas'))
      this.mainCanvas.on('mouse:down', mouseDown)
      console.log(mouseDown)
    },

    /**
     * @desc 创建矩形
     */
    drawRect(options) {
      //默认参数
      const _DEFAULT_OPTIONS = {
        top: 0,
        height: 30,
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
      console.log(e)
      e = e.e
      //如果该坐标已经属于某个 rect，不执行
      // if(this.isPosiOccupied(e.offsetX)) {
      //   return
      // }
      if(this.mainCanvas.findTarget(e)) {
        console.log('findTarget!!')
        return
      }

      //超过上限不再创建
      if(this.polygons.length)

      this.curCreatingInfo.x = e.offsetX
      this.mainCanvas.on('mouse:move', mouseMove)
      this.mainCanvas.on('mouse:up', mouseUp)

      this.curHandlingRect = this.drawRect({
        left: e.offsetX,
        width: 1
      })
    },

    canvasMouseMove(e) {
      e = e.e
      // if(e.target.tagName !== 'CANVAS') {
      //   return
      // }

      //先判断移动后的坐标是否有冲突
      if(this.isPosiOccupied(e.offsetX + 1, true)) {
        console.error('拖到下一个object里面了')
        return
      }
      if(this.isPosiOccupied(e.offsetX - 1, true)) {
        console.error('拖到上一个object里面了')
        return
      }

      console.log('通过，当前x=', e.offsetX)
      this.curHandlingRect.setOptions({
        width: e.offsetX - this.curCreatingInfo.x
      })
      this.curHandlingRect.setCoords()
      this.curHandlingRect.render(this.mainCanvas.getSelectionContext())
    },

    canvasMouseUp(e) {
      e = e.e
      console.log(e)
      // if(e.target.tagName !== 'CANVAS') {
      //   return
      // }

      // e.target.removeEventListener('mousemove', this.canvasMouseMove)
      // e.target.removeEventListener('mouseup', this.canvasMouseUp)
      this.mainCanvas.off('mouse:move', mouseMove)
      this.mainCanvas.off('mouse:up', mouseUp)
      // this.mainCanvas.off('mouse:down', mouseDown)

      // this.curHandlingRect.setCoords()
      this.mainCanvas.renderAll()

      this.mainCanvas.discardActiveObject()
      setTimeout(() => {
        this.mainCanvas.setActiveObject(this.curHandlingRect)
        this.curHandlingRect = null
      }, 2000)
    },

    rectSelected(e) {
      console.log('rectSelected', e)
      console.log(this.mainCanvas.getActiveObject())
    },

    rectMoving(e) {
      console.log('rectMoving', e)
      console.warn(e.target)
      console.warn(e.target.left - 1)
      if(this.isPosiOccupied(e.target.left - 1)) {
        console.error(this.lastOccupiedRect)
      }
    },

    /**
     * @desc 判断某个点是否被占用（选中的不判断）
     * @param {Number} x x坐标
     * @param {Boolean} isIgnoreLast 是否不检查最新那个 Rect
     */
    isPosiOccupied(x, isIgnoreLast) {
      let flag = false
      let curRect = this.mainCanvas.getActiveObject()
      console.log('curRect', curRect)
      // let occupiedObject = null
      console.log('判断 isPosiOccupied', x)
      //将所有点位 format2 {min:xxx, max:xxx} 这样的对象数组
      const rectRangeList = this.polygons.map((rect, index) => {
        // if(curRect && curRect.left === rect.left && curRect.width === rect.width) {
        //   console.error('死啦，不判断')
        //   return
        // }
        var range = {
          min: rect.left,
          max: rect.left + rect.width
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
      console.log('rectRangeList', rectRangeList)

      // if(flag) {
      //   console.error('被占用了。。应该调用 setActiveObject')
      //   var ctx = this.mainCanvas.getSelectionContext()
      //   this.mainCanvas.setActiveObject(occupiedObject)
      //   this.mainCanvas.drawControls(ctx)
      // }
      return flag
    }
  }
}
</script>

<style lang="scss" scoped>
#main {
  width: 400px;
  height: 100px;
  border: 1px solid #ccc;
  #main-canvas {
    width: 100%;
    height: 100%;
  }
}
</style>