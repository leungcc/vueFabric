class CommUtils {
  uuid() {
    return new Date().getTime() + Math.random().toString().slice(-10)
  }
}

export default new CommUtils()