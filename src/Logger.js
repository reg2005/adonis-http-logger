'use strict'

/**
 * adonis-logger
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const prettyMs = require('pretty-ms')
const onFinished = require('on-finished')

/**
 * Logs http request using AdonisJs in built logger
 */
class Logger {
  constructor ({ request, response, auth }, Logger) {
    this.request = request
    this.auth = auth
    this.res = response.response
    this.Logger = Logger
  }

  /**
   * Whether config is set to use JSON
   *
   * @method isJson
   *
   * @return {Boolean}
   */
  get isJson () {
    return this.Logger.driver.config && this.Logger.driver.config.json
  }

  /**
   * Returns the diff in milliseconds using process.hrtime. Started
   * at time is required
   *
   * @method _diffHrTime
   *
   * @param  {Array}    startedAt
   *
   * @return {Number}
   *
   * @private
   */
  _diffHrTime (startedAt) {
    const diff = process.hrtime(startedAt)
    return ((diff[0] * 1e9) + diff[1]) / 1e6
  }

  /**
   * Returns the log level based on the status code
   *
   * @method _getLogLevel
   *
   * @param  {Number}     statusCode
   *
   * @return {String}
   *
   * @private
   */
  _getLogLevel (statusCode) {
    if (statusCode < 400) {
      return 'info'
    }

    if (statusCode >= 400 && statusCode < 500) {
      return 'warning'
    }

    return 'error'
  }

  /**
   * Logs http request using the Adonis inbuilt logger
   *
   * @method log
   *
   * @param  {String} url
   * @param  {String} method
   * @param  {Number} statusCode
   * @param  {Array} startedAt
   * @param  {String} code
   *
   * @return {void}
   */
  log (url, ip, method, input, statusCode, userId, startedAt, code) {
    const ms = prettyMs(this._diffHrTime(startedAt))
    const logLevel = this._getLogLevel(statusCode)

    /**
     * Log normally when json is not set to true
     */
    if (!this.isJson) {
      this.Logger[logLevel]('%s %s %s %s %s %s %s', ip, method, input, statusCode, userId, url, ms)
      return
    }

    const payload = { ip, method, input, statusCode, userId, url, ms }
    if (code) {
      payload.code = code
    }
    this.Logger[logLevel]('http request', payload)
  }

  /**
   * Binds the hook to listen for finish event
   *
   * @method hook
   *
   * @return {void}
   */
  hook () {
    const start = process.hrtime()
    const url = this.request.url()
    const method = this.request.method()
    const input = this.request.input() || {}
    const ip = this.request.ip()
    const userId = this.auth.user && this.auth.user.id ? this.auth.user.id : null

    onFinished(this.res, (error, res) => {
      this.log(url, ip, method, JSON.stringify(input), res.statusCode, userId, start, error ? error.code : null)
    })
  }
}

module.exports = Logger
