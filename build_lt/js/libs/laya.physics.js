(function (exports, Laya) {
    'use strict';

    class IPhysics {
    }
    IPhysics.RigidBody = null;
    IPhysics.Physics = null;

    class ColliderBase extends Laya.Component {
        constructor() {
            super(...arguments);
            this._isSensor = false;
            this._density = 10;
            this._friction = 0.2;
            this._restitution = 0;
        }
        getDef() {
            if (!this._def) {
                var def = new window.box2d.b2FixtureDef();
                def.density = this.density;
                def.friction = this.friction;
                def.isSensor = this.isSensor;
                def.restitution = this.restitution;
                def.shape = this._shape;
                this._def = def;
            }
            return this._def;
        }
        _onEnable() {
            if (this.rigidBody) {
                this.refresh();
            }
            else {
                Laya.Laya.systemTimer.callLater(this, this._checkRigidBody);
            }
        }
        _checkRigidBody() {
            if (!this.rigidBody) {
                var comp = this.owner.getComponent(IPhysics.RigidBody);
                if (comp) {
                    this.rigidBody = comp;
                    this.refresh();
                }
            }
        }
        _onDestroy() {
            if (this.rigidBody) {
                if (this.fixture) {
                    if (this.fixture.GetBody() == this.rigidBody._getOriBody()) {
                        this.rigidBody.body.DestroyFixture(this.fixture);
                    }
                    this.fixture = null;
                }
                this.rigidBody = null;
                this._shape = null;
                this._def = null;
            }
        }
        get isSensor() {
            return this._isSensor;
        }
        set isSensor(value) {
            this._isSensor = value;
            if (this._def) {
                this._def.isSensor = value;
                this.refresh();
            }
        }
        get density() {
            return this._density;
        }
        set density(value) {
            this._density = value;
            if (this._def) {
                this._def.density = value;
                this.refresh();
            }
        }
        get friction() {
            return this._friction;
        }
        set friction(value) {
            this._friction = value;
            if (this._def) {
                this._def.friction = value;
                this.refresh();
            }
        }
        get restitution() {
            return this._restitution;
        }
        set restitution(value) {
            this._restitution = value;
            if (this._def) {
                this._def.restitution = value;
                this.refresh();
            }
        }
        refresh() {
            if (this.enabled && this.rigidBody) {
                var body = this.rigidBody.body;
                if (this.fixture) {
                    if (this.fixture.GetBody() == this.rigidBody.body) {
                        this.rigidBody.body.DestroyFixture(this.fixture);
                    }
                    this.fixture.Destroy();
                    this.fixture = null;
                }
                var def = this.getDef();
                def.filter.groupIndex = this.rigidBody.group;
                def.filter.categoryBits = this.rigidBody.category;
                def.filter.maskBits = this.rigidBody.mask;
                this.fixture = body.CreateFixture(def);
                this.fixture.collider = this;
            }
        }
        resetShape(re = true) {
        }
        get isSingleton() {
            return false;
        }
    }
    Laya.ClassUtils.regClass("laya.physics.ColliderBase", ColliderBase);
    Laya.ClassUtils.regClass("Laya.ColliderBase", ColliderBase);

    class RigidBody extends Laya.Component {
        constructor() {
            super(...arguments);
            this._type = "dynamic";
            this._allowSleep = true;
            this._angularVelocity = 0;
            this._angularDamping = 0;
            this._linearVelocity = { x: 0, y: 0 };
            this._linearDamping = 0;
            this._bullet = false;
            this._allowRotation = true;
            this._gravityScale = 1;
            this.group = 0;
            this.category = 1;
            this.mask = -1;
            this.label = "RigidBody";
        }
        _createBody() {
            if (this._body || !this.owner)
                return;
            var sp = this.owner;
            var box2d = window.box2d;
            var def = new box2d.b2BodyDef();
            var point = sp.localToGlobal(Laya.Point.TEMP.setTo(0, 0), false, IPhysics.Physics.I.worldRoot);
            def.position.Set(point.x / IPhysics.Physics.PIXEL_RATIO, point.y / IPhysics.Physics.PIXEL_RATIO);
            def.angle = Laya.Utils.toRadian(sp.rotation);
            def.allowSleep = this._allowSleep;
            def.angularDamping = this._angularDamping;
            def.angularVelocity = this._angularVelocity;
            def.bullet = this._bullet;
            def.fixedRotation = !this._allowRotation;
            def.gravityScale = this._gravityScale;
            def.linearDamping = this._linearDamping;
            var obj = this._linearVelocity;
            if (obj && obj.x != 0 || obj.y != 0) {
                def.linearVelocity = new box2d.b2Vec2(obj.x, obj.y);
            }
            def.type = box2d.b2BodyType["b2_" + this._type + "Body"];
            this._body = IPhysics.Physics.I._createBody(def);
            this.resetCollider(false);
        }
        _onAwake() {
            this._createBody();
        }
        _onEnable() {
            var _$this = this;
            this._createBody();
            Laya.Laya.physicsTimer.frameLoop(1, this, this._sysPhysicToNode);
            var sp = this.owner;
            if (this.accessGetSetFunc(sp, "x", "set") && !sp._changeByRigidBody) {
                sp._changeByRigidBody = true;
                function setX(value) {
                    _$this.accessGetSetFunc(sp, "x", "set")(value);
                    _$this._sysPosToPhysic();
                }
                this._overSet(sp, "x", setX);
                function setY(value) {
                    _$this.accessGetSetFunc(sp, "y", "set")(value);
                    _$this._sysPosToPhysic();
                }
                this._overSet(sp, "y", setY);
                function setRotation(value) {
                    _$this.accessGetSetFunc(sp, "rotation", "set")(value);
                    _$this._sysNodeToPhysic();
                }
                this._overSet(sp, "rotation", setRotation);
                function setScaleX(value) {
                    _$this.accessGetSetFunc(sp, "scaleX", "set")(value);
                    _$this.resetCollider(true);
                }
                this._overSet(sp, "scaleX", setScaleX);
                function setScaleY(value) {
                    _$this.accessGetSetFunc(sp, "scaleY", "set")(value);
                    _$this.resetCollider(true);
                }
                this._overSet(sp, "scaleY", setScaleY);
            }
        }
        accessGetSetFunc(obj, prop, accessor) {
            if (["get", "set"].indexOf(accessor) === -1) {
                return;
            }
            let privateProp = `_$${accessor}_${prop}`;
            if (obj[privateProp]) {
                return obj[privateProp];
            }
            let ObjConstructor = obj.constructor;
            let des;
            while (ObjConstructor) {
                des = Object.getOwnPropertyDescriptor(ObjConstructor.prototype, prop);
                if (des && des[accessor]) {
                    obj[privateProp] = des[accessor].bind(obj);
                    break;
                }
                ObjConstructor = Object.getPrototypeOf(ObjConstructor);
            }
            return obj[privateProp];
        }
        resetCollider(resetShape) {
            var comps = this.owner.getComponents(ColliderBase);
            if (comps) {
                for (var i = 0, n = comps.length; i < n; i++) {
                    var collider = comps[i];
                    collider.rigidBody = this;
                    if (resetShape)
                        collider.resetShape();
                    else
                        collider.refresh();
                }
            }
        }
        _sysPhysicToNode() {
            if (this.type != "static" && this._body.IsAwake()) {
                var pos = this._body.GetPosition();
                var ang = this._body.GetAngle();
                var sp = this.owner;
                this.accessGetSetFunc(sp, "rotation", "set")(Laya.Utils.toAngle(ang) - sp.parent.globalRotation);
                if (ang == 0) {
                    var point = sp.parent.globalToLocal(Laya.Point.TEMP.setTo(pos.x * IPhysics.Physics.PIXEL_RATIO + sp.pivotX, pos.y * IPhysics.Physics.PIXEL_RATIO + sp.pivotY), false, IPhysics.Physics.I.worldRoot);
                    this.accessGetSetFunc(sp, "x", "set")(point.x);
                    this.accessGetSetFunc(sp, "y", "set")(point.y);
                }
                else {
                    point = sp.globalToLocal(Laya.Point.TEMP.setTo(pos.x * IPhysics.Physics.PIXEL_RATIO, pos.y * IPhysics.Physics.PIXEL_RATIO), false, IPhysics.Physics.I.worldRoot);
                    point.x += sp.pivotX;
                    point.y += sp.pivotY;
                    point = sp.toParentPoint(point);
                    this.accessGetSetFunc(sp, "x", "set")(point.x);
                    this.accessGetSetFunc(sp, "y", "set")(point.y);
                }
            }
        }
        _sysNodeToPhysic() {
            var sp = this.owner;
            this._body.SetAngle(Laya.Utils.toRadian(sp.rotation));
            var p = sp.localToGlobal(Laya.Point.TEMP.setTo(0, 0), false, IPhysics.Physics.I.worldRoot);
            this._body.SetPositionXY(p.x / IPhysics.Physics.PIXEL_RATIO, p.y / IPhysics.Physics.PIXEL_RATIO);
        }
        _sysPosToPhysic() {
            var sp = this.owner;
            var p = sp.localToGlobal(Laya.Point.TEMP.setTo(0, 0), false, IPhysics.Physics.I.worldRoot);
            this._body.SetPositionXY(p.x / IPhysics.Physics.PIXEL_RATIO, p.y / IPhysics.Physics.PIXEL_RATIO);
        }
        _overSet(sp, prop, getfun) {
            Object.defineProperty(sp, prop, { get: this.accessGetSetFunc(sp, prop, "get"), set: getfun, enumerable: false, configurable: true });
        }
        _onDisable() {
            Laya.Laya.physicsTimer.clear(this, this._sysPhysicToNode);
            this._body && IPhysics.Physics.I._removeBody(this._body);
            this._body = null;
            var owner = this.owner;
            if (owner._changeByRigidBody) {
                this._overSet(owner, "x", this.accessGetSetFunc(owner, "x", "set"));
                this._overSet(owner, "y", this.accessGetSetFunc(owner, "y", "set"));
                this._overSet(owner, "rotation", this.accessGetSetFunc(owner, "rotation", "set"));
                this._overSet(owner, "scaleX", this.accessGetSetFunc(owner, "scaleX", "set"));
                this._overSet(owner, "scaleY", this.accessGetSetFunc(owner, "scaleY", "set"));
                owner._changeByRigidBody = false;
            }
        }
        getBody() {
            if (!this._body)
                this._onAwake();
            return this._body;
        }
        _getOriBody() {
            return this._body;
        }
        get body() {
            if (!this._body)
                this._onAwake();
            return this._body;
        }
        applyForce(position, force) {
            if (!this._body)
                this._onAwake();
            this._body.ApplyForce(force, position);
        }
        applyForceToCenter(force) {
            if (!this._body)
                this._onAwake();
            this._body.ApplyForceToCenter(force);
        }
        applyLinearImpulse(position, impulse) {
            if (!this._body)
                this._onAwake();
            this._body.ApplyLinearImpulse(impulse, position);
        }
        applyLinearImpulseToCenter(impulse) {
            if (!this._body)
                this._onAwake();
            this._body.ApplyLinearImpulseToCenter(impulse);
        }
        applyTorque(torque) {
            if (!this._body)
                this._onAwake();
            this._body.ApplyTorque(torque);
        }
        setVelocity(velocity) {
            if (!this._body)
                this._onAwake();
            this._body.SetLinearVelocity(velocity);
        }
        setAngle(value) {
            if (!this._body)
                this._onAwake();
            this._body.SetAngle(value);
            this._body.SetAwake(true);
        }
        getMass() {
            return this._body ? this._body.GetMass() : 0;
        }
        getCenter() {
            if (!this._body)
                this._onAwake();
            var p = this._body.GetLocalCenter();
            p.x = p.x * IPhysics.Physics.PIXEL_RATIO;
            p.y = p.y * IPhysics.Physics.PIXEL_RATIO;
            return p;
        }
        getWorldCenter() {
            if (!this._body)
                this._onAwake();
            var p = this._body.GetWorldCenter();
            p.x = p.x * IPhysics.Physics.PIXEL_RATIO;
            p.y = p.y * IPhysics.Physics.PIXEL_RATIO;
            return p;
        }
        get type() {
            return this._type;
        }
        set type(value) {
            this._type = value;
            if (this._body)
                this._body.SetType(window.box2d.b2BodyType["b2_" + this._type + "Body"]);
        }
        get gravityScale() {
            return this._gravityScale;
        }
        set gravityScale(value) {
            this._gravityScale = value;
            if (this._body)
                this._body.SetGravityScale(value);
        }
        get allowRotation() {
            return this._allowRotation;
        }
        set allowRotation(value) {
            this._allowRotation = value;
            if (this._body)
                this._body.SetFixedRotation(!value);
        }
        get allowSleep() {
            return this._allowSleep;
        }
        set allowSleep(value) {
            this._allowSleep = value;
            if (this._body)
                this._body.SetSleepingAllowed(value);
        }
        get angularDamping() {
            return this._angularDamping;
        }
        set angularDamping(value) {
            this._angularDamping = value;
            if (this._body)
                this._body.SetAngularDamping(value);
        }
        get angularVelocity() {
            if (this._body)
                return this._body.GetAngularVelocity();
            return this._angularVelocity;
        }
        set angularVelocity(value) {
            this._angularVelocity = value;
            if (this._body)
                this._body.SetAngularVelocity(value);
        }
        get linearDamping() {
            return this._linearDamping;
        }
        set linearDamping(value) {
            this._linearDamping = value;
            if (this._body)
                this._body.SetLinearDamping(value);
        }
        get linearVelocity() {
            if (this._body) {
                var vec = this._body.GetLinearVelocity();
                return { x: vec.x, y: vec.y };
            }
            return this._linearVelocity;
        }
        set linearVelocity(value) {
            if (!value)
                return;
            if (value instanceof Array) {
                value = { x: value[0], y: value[1] };
            }
            this._linearVelocity = value;
            if (this._body)
                this._body.SetLinearVelocity(new window.box2d.b2Vec2(value.x, value.y));
        }
        get bullet() {
            return this._bullet;
        }
        set bullet(value) {
            this._bullet = value;
            if (this._body)
                this._body.SetBullet(value);
        }
    }
    Laya.ClassUtils.regClass("laya.physics.RigidBody", RigidBody);
    Laya.ClassUtils.regClass("Laya.RigidBody", RigidBody);

    class DestructionListener {
        SayGoodbyeJoint(params) {
            params.m_userData && (params.m_userData.isDestroy = true);
        }
        SayGoodbyeFixture(params) {
        }
        SayGoodbyeParticleGroup(params) {
        }
        SayGoodbyeParticle(params) {
        }
    }

    class Physics extends Laya.EventDispatcher {
        constructor() {
            super();
            this.box2d = window.box2d;
            this.velocityIterations = 8;
            this.positionIterations = 3;
            this._eventList = [];
        }
        static get I() {
            return Physics._I || (Physics._I = new Physics());
        }
        static enable(options = null) {
            Physics.I.start(options);
            IPhysics.RigidBody = RigidBody;
            IPhysics.Physics = this;
        }
        start(options = null) {
            if (!this._enabled) {
                this._enabled = true;
                options || (options = {});
                var box2d = window.box2d;
                if (box2d == null) {
                    console.error("Can not find box2d libs, you should request box2d.js first.");
                    return;
                }
                var gravity = new box2d.b2Vec2(0, options.gravity || 500 / Physics.PIXEL_RATIO);
                this.world = new box2d.b2World(gravity);
                this.world.SetDestructionListener(new DestructionListener());
                this.world.SetContactListener(new ContactListener());
                this.allowSleeping = options.allowSleeping == null ? true : options.allowSleeping;
                if (!options.customUpdate)
                    Laya.Laya.physicsTimer.frameLoop(1, this, this._update);
                this._emptyBody = this._createBody(new window.box2d.b2BodyDef());
            }
        }
        _update() {
            this.world.Step(1 / 60, this.velocityIterations, this.positionIterations, 3);
            var len = this._eventList.length;
            if (len > 0) {
                for (var i = 0; i < len; i += 2) {
                    this._sendEvent(this._eventList[i], this._eventList[i + 1]);
                }
                this._eventList.length = 0;
            }
        }
        _sendEvent(type, contact) {
            var colliderA = contact.GetFixtureA().collider;
            var colliderB = contact.GetFixtureB().collider;
            var ownerA = colliderA.owner;
            var ownerB = colliderB.owner;
            contact.getHitInfo = function () {
                var manifold = new this.box2d.b2WorldManifold();
                this.GetWorldManifold(manifold);
                var p = manifold.points[0];
                p.x *= Physics.PIXEL_RATIO;
                p.y *= Physics.PIXEL_RATIO;
                return manifold;
            };
            if (ownerA) {
                var args = [colliderB, colliderA, contact];
                if (type === 0) {
                    ownerA.event(Laya.Event.TRIGGER_ENTER, args);
                    if (!ownerA["_triggered"]) {
                        ownerA["_triggered"] = true;
                    }
                    else {
                        ownerA.event(Laya.Event.TRIGGER_STAY, args);
                    }
                }
                else {
                    ownerA["_triggered"] = false;
                    ownerA.event(Laya.Event.TRIGGER_EXIT, args);
                }
            }
            if (ownerB) {
                args = [colliderA, colliderB, contact];
                if (type === 0) {
                    ownerB.event(Laya.Event.TRIGGER_ENTER, args);
                    if (!ownerB["_triggered"]) {
                        ownerB["_triggered"] = true;
                    }
                    else {
                        ownerB.event(Laya.Event.TRIGGER_STAY, args);
                    }
                }
                else {
                    ownerB["_triggered"] = false;
                    ownerB.event(Laya.Event.TRIGGER_EXIT, args);
                }
            }
        }
        _createBody(def) {
            if (this.world) {
                return this.world.CreateBody(def);
            }
            else {
                console.error('The physical engine should be initialized first.use "Physics.enable()"');
                return null;
            }
        }
        _removeBody(body) {
            if (this.world) {
                this.world.DestroyBody(body);
            }
            else {
                console.error('The physical engine should be initialized first.use "Physics.enable()"');
            }
        }
        _createJoint(def) {
            if (this.world) {
                let joint = this.world.CreateJoint(def);
                joint.m_userData = {};
                joint.m_userData.isDestroy = false;
                return joint;
            }
            else {
                console.error('The physical engine should be initialized first.use "Physics.enable()"');
                return null;
            }
        }
        _removeJoint(joint) {
            if (this.world) {
                this.world.DestroyJoint(joint);
            }
            else {
                console.error('The physical engine should be initialized first.use "Physics.enable()"');
            }
        }
        stop() {
            Laya.Laya.physicsTimer.clear(this, this._update);
        }
        get allowSleeping() {
            return this.world.GetAllowSleeping();
        }
        set allowSleeping(value) {
            this.world.SetAllowSleeping(value);
        }
        get gravity() {
            return this.world.GetGravity();
        }
        set gravity(value) {
            this.world.SetGravity(value);
        }
        getBodyCount() {
            return this.world.GetBodyCount();
        }
        getContactCount() {
            return this.world.GetContactCount();
        }
        getJointCount() {
            return this.world.GetJointCount();
        }
        get worldRoot() {
            return this._worldRoot || Laya.Laya.stage;
        }
        set worldRoot(value) {
            this._worldRoot = value;
            if (value) {
                var p = value.localToGlobal(Laya.Point.TEMP.setTo(0, 0));
                this.world.ShiftOrigin({ x: p.x / Physics.PIXEL_RATIO, y: p.y / Physics.PIXEL_RATIO });
            }
        }
    }
    Physics.PIXEL_RATIO = 50;
    Laya.ClassUtils.regClass("laya.physics.Physics", Physics);
    Laya.ClassUtils.regClass("Laya.Physics", Physics);
    class ContactListener {
        BeginContact(contact) {
            Physics.I._eventList.push(0, contact);
        }
        EndContact(contact) {
            Physics.I._eventList.push(1, contact);
        }
        PreSolve(contact, oldManifold) {
        }
        PostSolve(contact, impulse) {
        }
    }

    class BoxCollider extends ColliderBase {
        constructor() {
            super(...arguments);
            this._x = 0;
            this._y = 0;
            this._width = 100;
            this._height = 100;
        }
        getDef() {
            if (!this._shape) {
                this._shape = new window.box2d.b2PolygonShape();
                this._setShape(false);
            }
            this.label = (this.label || "BoxCollider");
            return super.getDef();
        }
        _setShape(re = true) {
            var scaleX = (this.owner["scaleX"] || 1);
            var scaleY = (this.owner["scaleY"] || 1);
            this._shape.SetAsBox(this._width / 2 / Physics.PIXEL_RATIO * scaleX, this._height / 2 / Physics.PIXEL_RATIO * scaleY, new window.box2d.b2Vec2((this._width / 2 + this._x) / Physics.PIXEL_RATIO * scaleX, (this._height / 2 + this._y) / Physics.PIXEL_RATIO * scaleY));
            if (re)
                this.refresh();
        }
        get x() {
            return this._x;
        }
        set x(value) {
            this._x = value;
            if (this._shape)
                this._setShape();
        }
        get y() {
            return this._y;
        }
        set y(value) {
            this._y = value;
            if (this._shape)
                this._setShape();
        }
        get width() {
            return this._width;
        }
        set width(value) {
            if (value <= 0)
                throw "BoxCollider size cannot be less than 0";
            this._width = value;
            if (this._shape)
                this._setShape();
        }
        get height() {
            return this._height;
        }
        set height(value) {
            if (value <= 0)
                throw "BoxCollider size cannot be less than 0";
            this._height = value;
            if (this._shape)
                this._setShape();
        }
        resetShape(re = true) {
            this._setShape();
        }
    }
    Laya.ClassUtils.regClass("laya.physics.BoxCollider", BoxCollider);
    Laya.ClassUtils.regClass("Laya.BoxCollider", BoxCollider);

    class ChainCollider extends ColliderBase {
        constructor() {
            super(...arguments);
            this._x = 0;
            this._y = 0;
            this._points = "0,0,100,0";
            this._loop = false;
        }
        getDef() {
            if (!this._shape) {
                this._shape = new window.box2d.b2ChainShape();
                this._setShape(false);
            }
            this.label = (this.label || "ChainCollider");
            return super.getDef();
        }
        _setShape(re = true) {
            var arr = this._points.split(",");
            var len = arr.length;
            if (len % 2 == 1)
                throw "ChainCollider points lenth must a multiplier of 2";
            var ps = [];
            for (var i = 0, n = len; i < n; i += 2) {
                ps.push(new window.box2d.b2Vec2((this._x + parseInt(arr[i])) / Physics.PIXEL_RATIO, (this._y + parseInt(arr[i + 1])) / Physics.PIXEL_RATIO));
            }
            this._loop ? this._shape.CreateLoop(ps, len / 2) : this._shape.CreateChain(ps, len / 2);
            if (re)
                this.refresh();
        }
        get x() {
            return this._x;
        }
        set x(value) {
            this._x = value;
            if (this._shape)
                this._setShape();
        }
        get y() {
            return this._y;
        }
        set y(value) {
            this._y = value;
            if (this._shape)
                this._setShape();
        }
        get points() {
            return this._points;
        }
        set points(value) {
            if (!value)
                throw "ChainCollider points cannot be empty";
            this._points = value;
            if (this._shape)
                this._setShape();
        }
        get loop() {
            return this._loop;
        }
        set loop(value) {
            this._loop = value;
            if (this._shape)
                this._setShape();
        }
    }
    Laya.ClassUtils.regClass("laya.physics.ChainCollider", ChainCollider);
    Laya.ClassUtils.regClass("Laya.ChainCollider", ChainCollider);

    class CircleCollider extends ColliderBase {
        constructor() {
            super(...arguments);
            this._x = 0;
            this._y = 0;
            this._radius = 50;
        }
        getDef() {
            if (!this._shape) {
                this._shape = new window.box2d.b2CircleShape();
                this._setShape(false);
            }
            this.label = (this.label || "CircleCollider");
            return super.getDef();
        }
        _setShape(re = true) {
            var scale = this.owner["scaleX"] || 1;
            this._shape.m_radius = this._radius / Physics.PIXEL_RATIO * scale;
            this._shape.m_p.Set((this._radius + this._x) / Physics.PIXEL_RATIO * scale, (this._radius + this._y) / Physics.PIXEL_RATIO * scale);
            if (re)
                this.refresh();
        }
        get x() {
            return this._x;
        }
        set x(value) {
            this._x = value;
            if (this._shape)
                this._setShape();
        }
        get y() {
            return this._y;
        }
        set y(value) {
            this._y = value;
            if (this._shape)
                this._setShape();
        }
        get radius() {
            return this._radius;
        }
        set radius(value) {
            if (value <= 0)
                throw "CircleCollider radius cannot be less than 0";
            this._radius = value;
            if (this._shape)
                this._setShape();
        }
        resetShape(re = true) {
            this._setShape();
        }
    }
    Laya.ClassUtils.regClass("laya.physics.CircleCollider", CircleCollider);
    Laya.ClassUtils.regClass("Laya.CircleCollider", CircleCollider);

    class PhysicsDebugDraw extends Laya.Sprite {
        constructor() {
            super();
            this.m_drawFlags = 99;
            if (!PhysicsDebugDraw._inited) {
                PhysicsDebugDraw._inited = true;
                PhysicsDebugDraw.init();
            }
            this._camera = {};
            this._camera.m_center = new PhysicsDebugDraw.box2d.b2Vec2(0, 0);
            this._camera.m_extent = 25;
            this._camera.m_zoom = 1;
            this._camera.m_width = 1280;
            this._camera.m_height = 800;
            this._mG = new Laya.Graphics();
            this.graphics = this._mG;
            this._textSp = new Laya.Sprite();
            this._textG = this._textSp.graphics;
            this.addChild(this._textSp);
        }
        static init() {
            PhysicsDebugDraw.box2d = Laya.Browser.window.box2d;
            PhysicsDebugDraw.DrawString_s_color = new PhysicsDebugDraw.box2d.b2Color(0.9, 0.6, 0.6);
            PhysicsDebugDraw.DrawStringWorld_s_p = new PhysicsDebugDraw.box2d.b2Vec2();
            PhysicsDebugDraw.DrawStringWorld_s_cc = new PhysicsDebugDraw.box2d.b2Vec2();
            PhysicsDebugDraw.DrawStringWorld_s_color = new PhysicsDebugDraw.box2d.b2Color(0.5, 0.9, 0.5);
        }
        render(ctx, x, y) {
            this._renderToGraphic();
            super.render(ctx, x, y);
        }
        _renderToGraphic() {
            if (this.world) {
                this._textG.clear();
                this._mG.clear();
                this._mG.save();
                this._mG.scale(Physics.PIXEL_RATIO, Physics.PIXEL_RATIO);
                this.lineWidth = 1 / Physics.PIXEL_RATIO;
                this.world.DrawDebugData();
                this._mG.restore();
            }
        }
        SetFlags(flags) {
            this.m_drawFlags = flags;
        }
        GetFlags() {
            return this.m_drawFlags;
        }
        AppendFlags(flags) {
            this.m_drawFlags |= flags;
        }
        ClearFlags(flags) {
            this.m_drawFlags &= ~flags;
        }
        PushTransform(xf) {
            this._mG.save();
            this._mG.translate(xf.p.x, xf.p.y);
            this._mG.rotate(xf.q.GetAngle());
        }
        PopTransform(xf) {
            this._mG.restore();
        }
        DrawPolygon(vertices, vertexCount, color) {
            var i, len;
            len = vertices.length;
            var points;
            points = [];
            for (i = 0; i < vertexCount; i++) {
                points.push(vertices[i].x, vertices[i].y);
            }
            this._mG.drawPoly(0, 0, points, null, color.MakeStyleString(1), this.lineWidth);
        }
        DrawSolidPolygon(vertices, vertexCount, color) {
            var i, len;
            len = vertices.length;
            var points;
            points = [];
            for (i = 0; i < vertexCount; i++) {
                points.push(vertices[i].x, vertices[i].y);
            }
            this._mG.drawPoly(0, 0, points, color.MakeStyleString(0.5), color.MakeStyleString(1), this.lineWidth);
        }
        DrawCircle(center, radius, color) {
            this._mG.drawCircle(center.x, center.y, radius, null, color.MakeStyleString(1), this.lineWidth);
        }
        DrawSolidCircle(center, radius, axis, color) {
            var cx = center.x;
            var cy = center.y;
            this._mG.drawCircle(cx, cy, radius, color.MakeStyleString(0.5), color.MakeStyleString(1), this.lineWidth);
            this._mG.drawLine(cx, cy, (cx + axis.x * radius), (cy + axis.y * radius), color.MakeStyleString(1), this.lineWidth);
        }
        DrawParticles(centers, radius, colors, count) {
            if (colors !== null) {
                for (var i = 0; i < count; ++i) {
                    var center = centers[i];
                    var color = colors[i];
                    this._mG.drawCircle(center.x, center.y, radius, color.MakeStyleString(), null, this.lineWidth);
                }
            }
            else {
                for (i = 0; i < count; ++i) {
                    center = centers[i];
                    this._mG.drawCircle(center.x, center.y, radius, "#ffff00", null, this.lineWidth);
                }
            }
        }
        DrawSegment(p1, p2, color) {
            this._mG.drawLine(p1.x, p1.y, p2.x, p2.y, color.MakeStyleString(1), this.lineWidth);
        }
        DrawTransform(xf) {
            this.PushTransform(xf);
            this._mG.drawLine(0, 0, 1, 0, PhysicsDebugDraw.box2d.b2Color.RED.MakeStyleString(1), this.lineWidth);
            this._mG.drawLine(0, 0, 0, 1, PhysicsDebugDraw.box2d.b2Color.GREEN.MakeStyleString(1), this.lineWidth);
            this.PopTransform(xf);
        }
        DrawPoint(p, size, color) {
            size *= this._camera.m_zoom;
            size /= this._camera.m_extent;
            var hsize = size / 2;
            this._mG.drawRect(p.x - hsize, p.y - hsize, size, size, color.MakeStyleString(), null);
        }
        DrawString(x, y, message) {
            this._textG.fillText(message, x, y, "15px DroidSans", PhysicsDebugDraw.DrawString_s_color.MakeStyleString(), "left");
        }
        DrawStringWorld(x, y, message) {
            this.DrawString(x, y, message);
        }
        DrawAABB(aabb, color) {
            var x = aabb.lowerBound.x;
            var y = aabb.lowerBound.y;
            var w = aabb.upperBound.x - aabb.lowerBound.x;
            var h = aabb.upperBound.y - aabb.lowerBound.y;
            this._mG.drawRect(x, y, w, h, null, color.MakeStyleString(), this.lineWidth);
        }
        static enable(flags = 99) {
            if (!PhysicsDebugDraw.I) {
                var debug = new PhysicsDebugDraw();
                debug.world = Physics.I.world;
                debug.world.SetDebugDraw(debug);
                debug.zOrder = 1000;
                debug.m_drawFlags = flags;
                Laya.Laya.stage.addChild(debug);
                PhysicsDebugDraw.I = debug;
            }
            return debug;
        }
    }
    PhysicsDebugDraw._inited = false;
    Laya.ClassUtils.regClass("laya.physics.PhysicsDebugDraw", PhysicsDebugDraw);
    Laya.ClassUtils.regClass("Laya.PhysicsDebugDraw", PhysicsDebugDraw);

    class PolygonCollider extends ColliderBase {
        constructor() {
            super(...arguments);
            this._x = 0;
            this._y = 0;
            this._points = "50,0,100,100,0,100";
        }
        getDef() {
            if (!this._shape) {
                this._shape = new window.box2d.b2PolygonShape();
                this._setShape(false);
            }
            this.label = (this.label || "PolygonCollider");
            return super.getDef();
        }
        _setShape(re = true) {
            var arr = this._points.split(",");
            var len = arr.length;
            if (len < 6)
                throw "PolygonCollider points must be greater than 3";
            if (len % 2 == 1)
                throw "PolygonCollider points lenth must a multiplier of 2";
            var ps = [];
            for (var i = 0, n = len; i < n; i += 2) {
                ps.push(new window.box2d.b2Vec2((this._x + parseInt(arr[i])) / Physics.PIXEL_RATIO, (this._y + parseInt(arr[i + 1])) / Physics.PIXEL_RATIO));
            }
            this._shape.Set(ps, len / 2);
            if (re)
                this.refresh();
        }
        get x() {
            return this._x;
        }
        set x(value) {
            this._x = value;
            if (this._shape)
                this._setShape();
        }
        get y() {
            return this._y;
        }
        set y(value) {
            this._y = value;
            if (this._shape)
                this._setShape();
        }
        get points() {
            return this._points;
        }
        set points(value) {
            if (!value)
                throw "PolygonCollider points cannot be empty";
            this._points = value;
            if (this._shape)
                this._setShape();
        }
    }
    Laya.ClassUtils.regClass("laya.physics.PolygonCollider", PolygonCollider);
    Laya.ClassUtils.regClass("Laya.PolygonCollider", PolygonCollider);

    class JointBase extends Laya.Component {
        get joint() {
            if (!this._joint)
                this._createJoint();
            return this._joint;
        }
        _onEnable() {
            this._createJoint();
        }
        _onAwake() {
            this._createJoint();
        }
        _createJoint() {
        }
        _onDisable() {
            if (this._joint && this._joint.m_userData && !this._joint.m_userData.isDestroy) {
                Physics.I._removeJoint(this._joint);
            }
            this._joint = null;
        }
    }
    Laya.ClassUtils.regClass("laya.physics.joint.JointBase", JointBase);
    Laya.ClassUtils.regClass("Laya.JointBase", JointBase);

    class DistanceJoint extends JointBase {
        constructor() {
            super(...arguments);
            this.selfAnchor = [0, 0];
            this.otherAnchor = [0, 0];
            this.collideConnected = false;
            this._length = 0;
            this._frequency = 0;
            this._damping = 0;
        }
        _createJoint() {
            if (!this._joint) {
                this.selfBody = this.selfBody || this.owner.getComponent(RigidBody);
                if (!this.selfBody)
                    throw "selfBody can not be empty";
                var box2d = window.box2d;
                var def = DistanceJoint._temp || (DistanceJoint._temp = new box2d.b2DistanceJointDef());
                def.bodyA = this.otherBody ? this.otherBody.getBody() : Physics.I._emptyBody;
                def.bodyB = this.selfBody.getBody();
                def.localAnchorA.Set(this.otherAnchor[0] / Physics.PIXEL_RATIO, this.otherAnchor[1] / Physics.PIXEL_RATIO);
                def.localAnchorB.Set(this.selfAnchor[0] / Physics.PIXEL_RATIO, this.selfAnchor[1] / Physics.PIXEL_RATIO);
                def.frequencyHz = this._frequency;
                def.dampingRatio = this._damping;
                def.collideConnected = this.collideConnected;
                var p1 = def.bodyA.GetWorldPoint(def.localAnchorA, new box2d.b2Vec2());
                var p2 = def.bodyB.GetWorldPoint(def.localAnchorB, new box2d.b2Vec2());
                def.length = this._length / Physics.PIXEL_RATIO || box2d.b2Vec2.SubVV(p2, p1, new box2d.b2Vec2()).Length();
                this._joint = Physics.I._createJoint(def);
            }
        }
        get length() {
            return this._length;
        }
        set length(value) {
            this._length = value;
            if (this._joint)
                this._joint.SetLength(value / Physics.PIXEL_RATIO);
        }
        get frequency() {
            return this._frequency;
        }
        set frequency(value) {
            this._frequency = value;
            if (this._joint)
                this._joint.SetFrequency(value);
        }
        get damping() {
            return this._damping;
        }
        set damping(value) {
            this._damping = value;
            if (this._joint)
                this._joint.SetDampingRatio(value);
        }
    }
    Laya.ClassUtils.regClass("laya.physics.joint.DistanceJoint", DistanceJoint);
    Laya.ClassUtils.regClass("Laya.DistanceJoint", DistanceJoint);

    class GearJoint extends JointBase {
        constructor() {
            super(...arguments);
            this.collideConnected = false;
            this._ratio = 1;
        }
        _createJoint() {
            if (!this._joint) {
                if (!this.joint1)
                    throw "Joint1 can not be empty";
                if (!this.joint2)
                    throw "Joint2 can not be empty";
                var box2d = window.box2d;
                var def = GearJoint._temp || (GearJoint._temp = new box2d.b2GearJointDef());
                def.bodyA = this.joint1.owner.getComponent(RigidBody).getBody();
                def.bodyB = this.joint2.owner.getComponent(RigidBody).getBody();
                def.joint1 = this.joint1.joint;
                def.joint2 = this.joint2.joint;
                def.ratio = this._ratio;
                def.collideConnected = this.collideConnected;
                this._joint = Physics.I._createJoint(def);
            }
        }
        get ratio() {
            return this._ratio;
        }
        set ratio(value) {
            this._ratio = value;
            if (this._joint)
                this._joint.SetRatio(value);
        }
    }
    Laya.ClassUtils.regClass("laya.physics.joint.GearJoint", GearJoint);
    Laya.ClassUtils.regClass("Laya.GearJoint", GearJoint);

    class MotorJoint extends JointBase {
        constructor() {
            super(...arguments);
            this.collideConnected = false;
            this._linearOffset = [0, 0];
            this._angularOffset = 0;
            this._maxForce = 1000;
            this._maxTorque = 1000;
            this._correctionFactor = 0.3;
        }
        _createJoint() {
            if (!this._joint) {
                if (!this.otherBody)
                    throw "otherBody can not be empty";
                this.selfBody = this.selfBody || this.owner.getComponent(RigidBody);
                if (!this.selfBody)
                    throw "selfBody can not be empty";
                var box2d = window.box2d;
                var def = MotorJoint._temp || (MotorJoint._temp = new box2d.b2MotorJointDef());
                def.Initialize(this.otherBody.getBody(), this.selfBody.getBody());
                def.linearOffset = new box2d.b2Vec2(this._linearOffset[0] / Physics.PIXEL_RATIO, this._linearOffset[1] / Physics.PIXEL_RATIO);
                def.angularOffset = this._angularOffset;
                def.maxForce = this._maxForce;
                def.maxTorque = this._maxTorque;
                def.correctionFactor = this._correctionFactor;
                def.collideConnected = this.collideConnected;
                this._joint = Physics.I._createJoint(def);
            }
        }
        get linearOffset() {
            return this._linearOffset;
        }
        set linearOffset(value) {
            this._linearOffset = value;
            if (this._joint)
                this._joint.SetLinearOffset(new window.box2d.b2Vec2(value[0] / Physics.PIXEL_RATIO, value[1] / Physics.PIXEL_RATIO));
        }
        get angularOffset() {
            return this._angularOffset;
        }
        set angularOffset(value) {
            this._angularOffset = value;
            if (this._joint)
                this._joint.SetAngularOffset(value);
        }
        get maxForce() {
            return this._maxForce;
        }
        set maxForce(value) {
            this._maxForce = value;
            if (this._joint)
                this._joint.SetMaxForce(value);
        }
        get maxTorque() {
            return this._maxTorque;
        }
        set maxTorque(value) {
            this._maxTorque = value;
            if (this._joint)
                this._joint.SetMaxTorque(value);
        }
        get correctionFactor() {
            return this._correctionFactor;
        }
        set correctionFactor(value) {
            this._correctionFactor = value;
            if (this._joint)
                this._joint.SetCorrectionFactor(value);
        }
    }
    Laya.ClassUtils.regClass("laya.physics.joint.MotorJoint", MotorJoint);
    Laya.ClassUtils.regClass("Laya.MotorJoint", MotorJoint);

    class MouseJoint extends JointBase {
        constructor() {
            super(...arguments);
            this._maxForce = 10000;
            this._frequency = 5;
            this._damping = 0.7;
        }
        _onEnable() {
            this.owner.on(Laya.Event.MOUSE_DOWN, this, this.onMouseDown);
        }
        _onAwake() {
        }
        onMouseDown() {
            this._createJoint();
            Laya.Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.onMouseMove);
            Laya.Laya.stage.once(Laya.Event.MOUSE_UP, this, this.onStageMouseUp);
        }
        _createJoint() {
            if (!this._joint) {
                this.selfBody = this.selfBody || this.owner.getComponent(RigidBody);
                if (!this.selfBody)
                    throw "selfBody can not be empty";
                var box2d = window.box2d;
                var def = MouseJoint._temp || (MouseJoint._temp = new box2d.b2MouseJointDef());
                if (this.anchor) {
                    var anchorPos = this.selfBody.owner.localToGlobal(Laya.Point.TEMP.setTo(this.anchor[0], this.anchor[1]), false, Physics.I.worldRoot);
                }
                else {
                    anchorPos = Physics.I.worldRoot.globalToLocal(Laya.Point.TEMP.setTo(Laya.Laya.stage.mouseX, Laya.Laya.stage.mouseY));
                }
                var anchorVec = new box2d.b2Vec2(anchorPos.x / Physics.PIXEL_RATIO, anchorPos.y / Physics.PIXEL_RATIO);
                def.bodyA = Physics.I._emptyBody;
                def.bodyB = this.selfBody.getBody();
                def.target = anchorVec;
                def.frequencyHz = this._frequency;
                def.damping = this._damping;
                def.maxForce = this._maxForce;
                this._joint = Physics.I._createJoint(def);
            }
        }
        onStageMouseUp() {
            Laya.Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.onMouseMove);
            super._onDisable();
        }
        onMouseMove() {
            this._joint.SetTarget(new window.box2d.b2Vec2(Physics.I.worldRoot.mouseX / Physics.PIXEL_RATIO, Physics.I.worldRoot.mouseY / Physics.PIXEL_RATIO));
        }
        _onDisable() {
            this.owner.off(Laya.Event.MOUSE_DOWN, this, this.onMouseDown);
            super._onDisable();
        }
        get maxForce() {
            return this._maxForce;
        }
        set maxForce(value) {
            this._maxForce = value;
            if (this._joint)
                this._joint.SetMaxForce(value);
        }
        get frequency() {
            return this._frequency;
        }
        set frequency(value) {
            this._frequency = value;
            if (this._joint)
                this._joint.SetFrequency(value);
        }
        get damping() {
            return this._damping;
        }
        set damping(value) {
            this._damping = value;
            if (this._joint)
                this._joint.SetDampingRatio(value);
        }
    }
    Laya.ClassUtils.regClass("laya.physics.joint.MouseJoint", MouseJoint);
    Laya.ClassUtils.regClass("Laya.MouseJoint", MouseJoint);

    class PrismaticJoint extends JointBase {
        constructor() {
            super(...arguments);
            this.anchor = [0, 0];
            this.axis = [1, 0];
            this.collideConnected = false;
            this._enableMotor = false;
            this._motorSpeed = 0;
            this._maxMotorForce = 10000;
            this._enableLimit = false;
            this._lowerTranslation = 0;
            this._upperTranslation = 0;
        }
        _createJoint() {
            if (!this._joint) {
                this.selfBody = this.selfBody || this.owner.getComponent(RigidBody);
                if (!this.selfBody)
                    throw "selfBody can not be empty";
                var box2d = window.box2d;
                var def = PrismaticJoint._temp || (PrismaticJoint._temp = new box2d.b2PrismaticJointDef());
                var anchorPos = this.selfBody.owner.localToGlobal(Laya.Point.TEMP.setTo(this.anchor[0], this.anchor[1]), false, Physics.I.worldRoot);
                var anchorVec = new box2d.b2Vec2(anchorPos.x / Physics.PIXEL_RATIO, anchorPos.y / Physics.PIXEL_RATIO);
                def.Initialize(this.otherBody ? this.otherBody.getBody() : Physics.I._emptyBody, this.selfBody.getBody(), anchorVec, new box2d.b2Vec2(this.axis[0], this.axis[1]));
                def.enableMotor = this._enableMotor;
                def.motorSpeed = this._motorSpeed;
                def.maxMotorForce = this._maxMotorForce;
                def.enableLimit = this._enableLimit;
                def.lowerTranslation = this._lowerTranslation / Physics.PIXEL_RATIO;
                def.upperTranslation = this._upperTranslation / Physics.PIXEL_RATIO;
                def.collideConnected = this.collideConnected;
                this._joint = Physics.I._createJoint(def);
            }
        }
        get enableMotor() {
            return this._enableMotor;
        }
        set enableMotor(value) {
            this._enableMotor = value;
            if (this._joint)
                this._joint.EnableMotor(value);
        }
        get motorSpeed() {
            return this._motorSpeed;
        }
        set motorSpeed(value) {
            this._motorSpeed = value;
            if (this._joint)
                this._joint.SetMotorSpeed(value);
        }
        get maxMotorForce() {
            return this._maxMotorForce;
        }
        set maxMotorForce(value) {
            this._maxMotorForce = value;
            if (this._joint)
                this._joint.SetMaxMotorForce(value);
        }
        get enableLimit() {
            return this._enableLimit;
        }
        set enableLimit(value) {
            this._enableLimit = value;
            if (this._joint)
                this._joint.EnableLimit(value);
        }
        get lowerTranslation() {
            return this._lowerTranslation;
        }
        set lowerTranslation(value) {
            this._lowerTranslation = value;
            if (this._joint)
                this._joint.SetLimits(value, this._upperTranslation);
        }
        get upperTranslation() {
            return this._upperTranslation;
        }
        set upperTranslation(value) {
            this._upperTranslation = value;
            if (this._joint)
                this._joint.SetLimits(this._lowerTranslation, value);
        }
    }
    Laya.ClassUtils.regClass("laya.physics.joint.PrismaticJoint", PrismaticJoint);
    Laya.ClassUtils.regClass("Laya.PrismaticJoint", PrismaticJoint);

    class PulleyJoint extends JointBase {
        constructor() {
            super(...arguments);
            this.selfAnchor = [0, 0];
            this.otherAnchor = [0, 0];
            this.selfGroundPoint = [0, 0];
            this.otherGroundPoint = [0, 0];
            this.ratio = 1.5;
            this.collideConnected = false;
        }
        _createJoint() {
            if (!this._joint) {
                if (!this.otherBody)
                    throw "otherBody can not be empty";
                this.selfBody = this.selfBody || this.owner.getComponent(RigidBody);
                if (!this.selfBody)
                    throw "selfBody can not be empty";
                var box2d = window.box2d;
                var def = PulleyJoint._temp || (PulleyJoint._temp = new box2d.b2PulleyJointDef());
                var posA = this.otherBody.owner.localToGlobal(Laya.Point.TEMP.setTo(this.otherAnchor[0], this.otherAnchor[1]), false, Physics.I.worldRoot);
                var anchorVecA = new box2d.b2Vec2(posA.x / Physics.PIXEL_RATIO, posA.y / Physics.PIXEL_RATIO);
                var posB = this.selfBody.owner.localToGlobal(Laya.Point.TEMP.setTo(this.selfAnchor[0], this.selfAnchor[1]), false, Physics.I.worldRoot);
                var anchorVecB = new box2d.b2Vec2(posB.x / Physics.PIXEL_RATIO, posB.y / Physics.PIXEL_RATIO);
                var groundA = this.otherBody.owner.localToGlobal(Laya.Point.TEMP.setTo(this.otherGroundPoint[0], this.otherGroundPoint[1]), false, Physics.I.worldRoot);
                var groundVecA = new box2d.b2Vec2(groundA.x / Physics.PIXEL_RATIO, groundA.y / Physics.PIXEL_RATIO);
                var groundB = this.selfBody.owner.localToGlobal(Laya.Point.TEMP.setTo(this.selfGroundPoint[0], this.selfGroundPoint[1]), false, Physics.I.worldRoot);
                var groundVecB = new box2d.b2Vec2(groundB.x / Physics.PIXEL_RATIO, groundB.y / Physics.PIXEL_RATIO);
                def.Initialize(this.otherBody.getBody(), this.selfBody.getBody(), groundVecA, groundVecB, anchorVecA, anchorVecB, this.ratio);
                def.collideConnected = this.collideConnected;
                this._joint = Physics.I._createJoint(def);
            }
        }
    }
    Laya.ClassUtils.regClass("laya.physics.joint.PulleyJoint", PulleyJoint);
    Laya.ClassUtils.regClass("Laya.PulleyJoint", PulleyJoint);

    class RevoluteJoint extends JointBase {
        constructor() {
            super(...arguments);
            this.anchor = [0, 0];
            this.collideConnected = false;
            this._enableMotor = false;
            this._motorSpeed = 0;
            this._maxMotorTorque = 10000;
            this._enableLimit = false;
            this._lowerAngle = 0;
            this._upperAngle = 0;
        }
        _createJoint() {
            if (!this._joint) {
                this.selfBody = this.selfBody || this.owner.getComponent(RigidBody);
                if (!this.selfBody)
                    throw "selfBody can not be empty";
                var box2d = window.box2d;
                var def = RevoluteJoint._temp || (RevoluteJoint._temp = new box2d.b2RevoluteJointDef());
                var anchorPos = this.selfBody.owner.localToGlobal(Laya.Point.TEMP.setTo(this.anchor[0], this.anchor[1]), false, Physics.I.worldRoot);
                var anchorVec = new box2d.b2Vec2(anchorPos.x / Physics.PIXEL_RATIO, anchorPos.y / Physics.PIXEL_RATIO);
                def.Initialize(this.otherBody ? this.otherBody.getBody() : Physics.I._emptyBody, this.selfBody.getBody(), anchorVec);
                def.enableMotor = this._enableMotor;
                def.motorSpeed = this._motorSpeed;
                def.maxMotorTorque = this._maxMotorTorque;
                def.enableLimit = this._enableLimit;
                def.lowerAngle = this._lowerAngle;
                def.upperAngle = this._upperAngle;
                def.collideConnected = this.collideConnected;
                this._joint = Physics.I._createJoint(def);
            }
        }
        get enableMotor() {
            return this._enableMotor;
        }
        set enableMotor(value) {
            this._enableMotor = value;
            if (this._joint)
                this._joint.EnableMotor(value);
        }
        get motorSpeed() {
            return this._motorSpeed;
        }
        set motorSpeed(value) {
            this._motorSpeed = value;
            if (this._joint)
                this._joint.SetMotorSpeed(value);
        }
        get maxMotorTorque() {
            return this._maxMotorTorque;
        }
        set maxMotorTorque(value) {
            this._maxMotorTorque = value;
            if (this._joint)
                this._joint.SetMaxMotorTorque(value);
        }
        get enableLimit() {
            return this._enableLimit;
        }
        set enableLimit(value) {
            this._enableLimit = value;
            if (this._joint)
                this._joint.EnableLimit(value);
        }
        get lowerAngle() {
            return this._lowerAngle;
        }
        set lowerAngle(value) {
            this._lowerAngle = value;
            if (this._joint)
                this._joint.SetLimits(value, this._upperAngle);
        }
        get upperAngle() {
            return this._upperAngle;
        }
        set upperAngle(value) {
            this._upperAngle = value;
            if (this._joint)
                this._joint.SetLimits(this._lowerAngle, value);
        }
    }
    Laya.ClassUtils.regClass("laya.physics.joint.RevoluteJoint", RevoluteJoint);
    Laya.ClassUtils.regClass("Laya.RevoluteJoint", RevoluteJoint);

    class RopeJoint extends JointBase {
        constructor() {
            super(...arguments);
            this.selfAnchor = [0, 0];
            this.otherAnchor = [0, 0];
            this.collideConnected = false;
            this._maxLength = 1;
        }
        _createJoint() {
            if (!this._joint) {
                this.selfBody = this.selfBody || this.owner.getComponent(RigidBody);
                if (!this.selfBody)
                    throw "selfBody can not be empty";
                var box2d = window.box2d;
                var def = RopeJoint._temp || (RopeJoint._temp = new box2d.b2RopeJointDef());
                def.bodyA = this.otherBody ? this.otherBody.getBody() : Physics.I._emptyBody;
                def.bodyB = this.selfBody.getBody();
                def.localAnchorA.Set(this.otherAnchor[0] / Physics.PIXEL_RATIO, this.otherAnchor[1] / Physics.PIXEL_RATIO);
                def.localAnchorB.Set(this.selfAnchor[0] / Physics.PIXEL_RATIO, this.selfAnchor[1] / Physics.PIXEL_RATIO);
                def.maxLength = this._maxLength / Physics.PIXEL_RATIO;
                def.collideConnected = this.collideConnected;
                this._joint = Physics.I._createJoint(def);
            }
        }
        get maxLength() {
            return this._maxLength;
        }
        set maxLength(value) {
            this._maxLength = value;
            if (this._joint)
                this._joint.SetMaxLength(value / Physics.PIXEL_RATIO);
        }
    }
    Laya.ClassUtils.regClass("laya.physics.joint.RopeJoint", RopeJoint);
    Laya.ClassUtils.regClass("Laya.RopeJoint", RopeJoint);

    class WeldJoint extends JointBase {
        constructor() {
            super(...arguments);
            this.anchor = [0, 0];
            this.collideConnected = false;
            this._frequency = 5;
            this._damping = 0.7;
        }
        _createJoint() {
            if (!this._joint) {
                if (!this.otherBody)
                    throw "otherBody can not be empty";
                this.selfBody = this.selfBody || this.owner.getComponent(RigidBody);
                if (!this.selfBody)
                    throw "selfBody can not be empty";
                var box2d = window.box2d;
                var def = WeldJoint._temp || (WeldJoint._temp = new box2d.b2WeldJointDef());
                var anchorPos = this.selfBody.owner.localToGlobal(Laya.Point.TEMP.setTo(this.anchor[0], this.anchor[1]), false, Physics.I.worldRoot);
                var anchorVec = new box2d.b2Vec2(anchorPos.x / Physics.PIXEL_RATIO, anchorPos.y / Physics.PIXEL_RATIO);
                def.Initialize(this.otherBody.getBody(), this.selfBody.getBody(), anchorVec);
                def.frequencyHz = this._frequency;
                def.dampingRatio = this._damping;
                def.collideConnected = this.collideConnected;
                this._joint = Physics.I._createJoint(def);
            }
        }
        get frequency() {
            return this._frequency;
        }
        set frequency(value) {
            this._frequency = value;
            if (this._joint)
                this._joint.SetFrequency(value);
        }
        get damping() {
            return this._damping;
        }
        set damping(value) {
            this._damping = value;
            if (this._joint)
                this._joint.SetDampingRatio(value);
        }
    }
    Laya.ClassUtils.regClass("laya.physics.joint.WeldJoint", WeldJoint);
    Laya.ClassUtils.regClass("Laya.WeldJoint", WeldJoint);

    class WheelJoint extends JointBase {
        constructor() {
            super(...arguments);
            this.anchor = [0, 0];
            this.collideConnected = false;
            this.axis = [1, 0];
            this._frequency = 5;
            this._damping = 0.7;
            this._enableMotor = false;
            this._motorSpeed = 0;
            this._maxMotorTorque = 10000;
        }
        _createJoint() {
            if (!this._joint) {
                if (!this.otherBody)
                    throw "otherBody can not be empty";
                this.selfBody = this.selfBody || this.owner.getComponent(RigidBody);
                if (!this.selfBody)
                    throw "selfBody can not be empty";
                var box2d = window.box2d;
                var def = WheelJoint._temp || (WheelJoint._temp = new box2d.b2WheelJointDef());
                var anchorPos = this.selfBody.owner.localToGlobal(Laya.Point.TEMP.setTo(this.anchor[0], this.anchor[1]), false, Physics.I.worldRoot);
                var anchorVec = new box2d.b2Vec2(anchorPos.x / Physics.PIXEL_RATIO, anchorPos.y / Physics.PIXEL_RATIO);
                def.Initialize(this.otherBody.getBody(), this.selfBody.getBody(), anchorVec, new box2d.b2Vec2(this.axis[0], this.axis[1]));
                def.enableMotor = this._enableMotor;
                def.motorSpeed = this._motorSpeed;
                def.maxMotorTorque = this._maxMotorTorque;
                def.frequencyHz = this._frequency;
                def.dampingRatio = this._damping;
                def.collideConnected = this.collideConnected;
                this._joint = Physics.I._createJoint(def);
            }
        }
        get frequency() {
            return this._frequency;
        }
        set frequency(value) {
            this._frequency = value;
            if (this._joint)
                this._joint.SetSpringFrequencyHz(value);
        }
        get damping() {
            return this._damping;
        }
        set damping(value) {
            this._damping = value;
            if (this._joint)
                this._joint.SetSpringDampingRatio(value);
        }
        get enableMotor() {
            return this._enableMotor;
        }
        set enableMotor(value) {
            this._enableMotor = value;
            if (this._joint)
                this._joint.EnableMotor(value);
        }
        get motorSpeed() {
            return this._motorSpeed;
        }
        set motorSpeed(value) {
            this._motorSpeed = value;
            if (this._joint)
                this._joint.SetMotorSpeed(value);
        }
        get maxMotorTorque() {
            return this._maxMotorTorque;
        }
        set maxMotorTorque(value) {
            this._maxMotorTorque = value;
            if (this._joint)
                this._joint.SetMaxMotorTorque(value);
        }
    }
    Laya.ClassUtils.regClass("laya.physics.joint.WheelJoint", WheelJoint);
    Laya.ClassUtils.regClass("Laya.WheelJoint", WheelJoint);

    exports.BoxCollider = BoxCollider;
    exports.ChainCollider = ChainCollider;
    exports.CircleCollider = CircleCollider;
    exports.ColliderBase = ColliderBase;
    exports.DestructionListener = DestructionListener;
    exports.DistanceJoint = DistanceJoint;
    exports.GearJoint = GearJoint;
    exports.IPhysics = IPhysics;
    exports.JointBase = JointBase;
    exports.MotorJoint = MotorJoint;
    exports.MouseJoint = MouseJoint;
    exports.Physics = Physics;
    exports.PhysicsDebugDraw = PhysicsDebugDraw;
    exports.PolygonCollider = PolygonCollider;
    exports.PrismaticJoint = PrismaticJoint;
    exports.PulleyJoint = PulleyJoint;
    exports.RevoluteJoint = RevoluteJoint;
    exports.RigidBody = RigidBody;
    exports.RopeJoint = RopeJoint;
    exports.WeldJoint = WeldJoint;
    exports.WheelJoint = WheelJoint;

}(this.Laya = this.Laya || {}, Laya));
//# sourceMappingURL=laya.physics.js.map
