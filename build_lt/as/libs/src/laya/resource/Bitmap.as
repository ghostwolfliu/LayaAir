package laya.resource {
	import laya.resource.Resource;

	/**
	 * @private <code>Bitmap</code> 图片资源类。
	 */
	public class Bitmap extends Resource {

		/**
		 * @private 
		 */
		protected var _width:Number;

		/**
		 * @private 
		 */
		protected var _height:Number;

		/**
		 * 获取宽度。
		 */
		public function get width():Number{return null;}
		public function set width(width:Number):void{}

		/**
		 * *
		 * 获取高度。
		 */
		public function get height():Number{return null;}
		public function set height(height:Number):void{}

		/**
		 * 创建一个 <code>Bitmap</code> 实例。
		 */

		public function Bitmap(){}
	}

}
