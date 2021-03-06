package laya.d3.physics {
	import laya.d3.math.Vector3;
	import laya.d3.physics.PhysicsComponent;

	/**
	 * <code>CharacterController</code> 类用于创建角色控制器。
	 */
	public class CharacterController extends PhysicsComponent {
		public static var UPAXIS_X:Number;
		public static var UPAXIS_Y:Number;
		public static var UPAXIS_Z:Number;

		/**
		 * 角色降落速度。
		 */
		public function get fallSpeed():Number{return null;}
		public function set fallSpeed(value:Number):void{}

		/**
		 * 角色跳跃速度。
		 */
		public function get jumpSpeed():Number{return null;}
		public function set jumpSpeed(value:Number):void{}

		/**
		 * 重力。
		 */
		public function get gravity():Vector3{return null;}
		public function set gravity(value:Vector3):void{}

		/**
		 * 最大坡度。
		 */
		public function get maxSlope():Number{return null;}
		public function set maxSlope(value:Number):void{}

		/**
		 * 角色是否在地表。
		 */
		public function get isGrounded():Boolean{return null;}

		/**
		 * 角色行走的脚步高度，表示可跨越的最大高度。
		 */
		public function get stepHeight():Number{return null;}
		public function set stepHeight(value:Number):void{}

		/**
		 * 角色的Up轴。
		 */
		public function get upAxis():Vector3{return null;}
		public function set upAxis(value:Vector3):void{}

		/**
		 * 创建一个 <code>CharacterController</code> 实例。
		 * @param stepheight 角色脚步高度。
		 * @param upAxis 角色Up轴
		 * @param collisionGroup 所属碰撞组。
		 * @param canCollideWith 可产生碰撞的碰撞组。
		 */

		public function CharacterController(stepheight:Number = undefined,upAxis:Vector3 = undefined,collisionGroup:Number = undefined,canCollideWith:Number = undefined){}

		/**
		 * 通过指定移动向量移动角色。
		 * @param movement 移动向量。
		 */
		public function move(movement:Vector3):void{}

		/**
		 * 跳跃。
		 * @param velocity 跳跃速度。
		 */
		public function jump(velocity:Vector3 = null):void{}
	}

}
