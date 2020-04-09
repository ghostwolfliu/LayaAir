package laya.d3.physics.constraints {
	import laya.components.Component;
	import laya.d3.physics.Rigidbody3D;

	/**
	 * <code>ConstraintComponent</code> 类用于创建约束的父类。
	 */
	public class ConstraintComponent extends Component {

		/**
		 * @inheritDoc 
		 * @override 
		 */
		override public function get enabled():Boolean{return null;}

		/**
		 * @inheritDoc 
		 * @override 
		 */
		override public function set enabled(value:Boolean):void{}

		/**
		 * 获取打破冲力阈值。
		 * @return 打破冲力阈值。
		 */
		public function get breakingImpulseThreshold():Number{return null;}

		/**
		 * 设置打破冲力阈值。
		 * @param value 打破冲力阈值。
		 */
		public function set breakingImpulseThreshold(value:Number):void{}

		/**
		 * 获取应用的冲力。
		 */
		public function get appliedImpulse():Number{return null;}

		/**
		 * 获取已连接的刚体。
		 * @return 已连接刚体。
		 */
		public function get connectedBody():Rigidbody3D{return null;}

		/**
		 * 设置已连接刚体。
		 * @param value 已连接刚体。
		 */
		public function set connectedBody(value:Rigidbody3D):void{}

		/**
		 * 创建一个 <code>ConstraintComponent</code> 实例。
		 */

		public function ConstraintComponent(){}
	}

}
