*  未完成功能
  
* 支付
  
* 必要功能：
  * 实时同步
  * 实时订单
* 用户端

  * 二维码地址：/landing/restaurant/25/desk/8

  * 页面显示内容：

    * 餐厅名称，桌号，人数选择，开始点餐按钮

  * 点餐页面

  * /restaurant/25/desk/8?customs=3

  * 显示菜单，购物车，实时同步

  * 获取菜单：/api/menus?rid=25

  * websocket:

    * 链接后加入room
    * 下单的信息发往服务器
    * 服务器存储当前下单信息

  * 下单：

    * POST /api/placeorder

      ```
      {
      	restaurantId,
      	deskId,
      	customs,
      	[{foodId:1,amount:1},{foodId:2,amount:2}]
      }
      ```

      

* 商户端：
  * 登录注册，创建餐厅
  * 订单管理:
    * 订单信息：订单id，餐厅id， 桌面id，人数，菜品列表
  * 菜品管理：
    * 菜品信息： 名称，描述，价格，图片URL，id，菜品分类,restaurantId,上架状态
    * 获取菜品列表：GET /restaurant/3/foods
    * 删除菜品：DELETE  /restaurant/3/food/5
    * 增加菜品：POST      /restaurant/3/food
    * 修改菜品：PUT        /restaurant/3/food/5
  * 桌面管理:
    * 桌面信息：桌面名称，容纳人数，id，restaurantId
    * 获取桌面列表：GET /restaurant/3/desk
    * 删除桌面：DELETE  /restaurant/3/desk/5
    * 增加桌面：POST      /restaurant/3/desk
    * 修改桌面：PUT        /restaurant/3/desk/5

| users表 |      |      |      |      |
| :--: | ---- | ---- | ---- | ---- |
| id | name(用户名) | pwd | email(手机号用于找回密码) | title（餐厅名） |
```sql
create table users (
	id integer primary key,
	name string not null ,
	pwd string not null,
	email string,
	title string not null
);
INSERT INTO users (name,pwd,email,title) values ('a','123','a@xx.com','皇家酒店');
```

| foods 菜品表 |              |               |      |              |               |               |                    |                        |
| :----------: | ------------ | ------------- | ---- | ------------ | ------------- | ------------- | ------------------ | ---------------------- |
|      id      | rid (餐厅id) | name (菜品名) | desc（描述） | price（价格） | img(菜品图片) | category(菜品分类) | status(上架状态)on/off |
```sql
create table foods (
	id integer primary key,
	rid integer not null,
	name string not null,
	desc string,
	price integer not null,
	img string,
	category string,
	status string not null
);
INSERT INTO foods values(1,1,'苹果','甜',3,' ','水果','on');
INSERT INTO foods values(2,1,'梨','甜',4,' ','水果','on');
```
| desks |                 |              |                |
| :---: | --------------- | ------------ | -------------- |
|  id   | rid（餐厅编号） | name（名称） | capacity(人数) |
```sql
create table desks (
	id integer primary key,
	rid integer not null,
	name string not null,
	capacity integer
);
INSERT INTO desks (rid, name, capacity) values (1,'1',4);
```
| orders 订单表 |             |             |          |                     |            |                                           |                        |           |
| ------------- | ----------- | ----------- | -------- | ------------------- | ---------- | ----------------------------------------- | :--------------------: | --------- |
| id            | rid餐厅编号 | did桌子编号 | deskname | customCount（人数） | totalPrice | details（菜品列表）[{food.id,count,name}] | status（订单完成状态） | timestamp |

```sql
create table orders (
	id integer primary key,
  rid integer not null,
  did integer not null,
  deskname string not null,
  customCount integer not null,
  details string not null,
  status string,
  timestamp string not null,
  totalPrice integer,
);
```

-----

* 用户侧
  * 扫码进入页面，选择人数 /landing/restaurant/35/desk/20
  * 点餐页面： 						/restaurant/35/desk/20
  * 点餐成功：					/

* 商户侧、
  * 登陆
  * 订单管理：/restaurant/manage/order
  * 订单详情页：/restaurant/manage/order/35
  * 菜品管理：/restaurant/manage/food
  * 桌面管理：/restaurant/manage/desk





---

withRouter