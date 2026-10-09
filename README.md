# 优胜美地国家公园 · Yosemite National Park（中文信息站）

一个 1:1 复刻 [yosemite.com](https://www.yosemite.com/) 设计语言的响应式静态网站，全部文案已翻译为自然流畅的简体中文。

**共 11 个页面**：1 个首页 + 10 个栏目内页，导航与卡片入口全部真实可点。

---

## 一、文件结构

```
yosemite-site/
├── index.html              # 首页（约 31 KB）
├── waterfalls.html         # 瀑布指南（约 33 KB，旗舰内页）
├── areas.html              # 代表区域（约 25 KB）
├── plan.html               # 规划旅程（约 24 KB）
├── scenery.html            # 公园风光（约 19 KB）
├── seasons.html            # 四季游览（约 19 KB）
├── news.html               # 公园动态（约 18 KB）
├── tips.html               # 出行锦囊（约 17 KB）
├── camping.html            # 露营指南（约 19 KB）
├── lodging.html            # 园内住宿（约 17 KB）
├── permits.html            # 许可与预约（约 20 KB）
├── css/
│   ├── style.css           # 基础样式：布局 + 配色 + 响应式
│   ├── motion.css          # 动效样式：揭示态 + 悬停联动
│   ├── pages.css           # 内页样式：页头 / 侧栏目录 / 文档排版 / 卡片
│   └── design-upgrade.css  # 艺术指导层：颗粒质感 / 编辑版式 / 徽章 / 装饰（纯覆盖）
├── js/
│   ├── main.js             # 基础交互：轮播 / 菜单 / Tab / Toast
│   ├── motion.js           # 动效引擎：滚动驱动动画系统 + 阅读进度
│   └── pages.js            # 内页脚本：目录高亮 / 顶栏实心 / 图库灯箱
├── assets/                 # 图片素材
│   ├── banner-*.jpg        # 顶部轮播大图（3 张）
│   ├── area-*.jpg          # 代表区域配图（2 张）
│   ├── sc-*.jpg            # 风光横滑卡图（4 张）
│   ├── feat-*.jpg          # 规划旅程卡片图（4 张）
│   ├── season-*.jpg        # 四季配图（4 张）
│   ├── video-poster.jpg    # 宣传片封面
│   ├── yosemite-film.mp4   # 宣传片正片（16.7 MB，NPS 公有领域，480p / 3 分 16 秒）
│   ├── news-main.jpg       # 动态头条配图
│   ├── nps.png             # NPS 应用示意截图
│   └── animal.png          # AI 生成图（当前未被引用，可删除）
├── screenshots/            # 首页实测截图（用于效果核对 / 投稿评分）
├── _build/                 # 开发辅助（可选，不参与运行，上线可不部署）
│   ├── gen_common.py       # 内页共享外壳生成器（页头 / 面包屑 / 目录 / 页脚）
│   ├── gen_pages.py        # 生成 scenery / plan / seasons / news / tips
│   ├── gen_pages2.py       # 生成 camping / lodging / permits
│   ├── apply_design.py     # 把设计升级注入全部 11 页（幂等）
│   ├── rebuild_badge.py    # 重建公园徽章 SVG
│   ├── add_handfont.py     # （历史）接入中文手写体；后因批注删除已由 remove_handfont.py 回退
│   ├── remove_handfont.py  # 移除不再使用的 Ma Shan Zheng 字体
│   ├── verify.js           # 批量实测：11 页 × 3 视口（破图 / 溢出 / 目录 / 报错）
│   ├── functest.js         # 交互实测：Tab / 目录 / 灯箱 / 内链 / 阅读进度 / 导语块 / 视频
│   ├── dropcap5.js         # 首字不影响正文行盒的 A/B 对照（有首字 vs 中和首字）
│   ├── dropcap6.js         # 同上，附带桌面/移动双视口
│   ├── check3.js           # About 专项：视频播放 / 统计项间距
│   ├── leadcheck.js        # 导语块专项：四角标记 / 年份强调 / 首字下沉
│   ├── vcheck.js           # 视频封面隐藏与真实播放（不注入强制样式）
│   ├── zoom.js zoom2.js    # 局部特写（导航徽章 / 章节编号 / 页脚 / 规划卡）
│   ├── zoom3.js            # 首字下沉 / 「约」前缀专项
│   ├── imgcheck.js         # 破图逐条定位
│   └── shots/              # 自动产出的截图
└── README.md               # 本文件
```

### 为什么这样分层

| 文件 | 职责 | 为什么独立 |
|---|---|---|
| `index.html` 等 11 个 HTML | 只负责**结构**和中文内容 | 改文案不用碰样式 |
| `css/style.css` | 基础**外观** | 顶部 `:root` 集中管理设计变量 |
| `css/motion.css` | **动效状态**样式 | 与基础样式解耦，不要动效时删掉即可 |
| `css/pages.css` | **内页专属**样式 | 首页不加载，避免样式互相污染 |
| `js/main.js` | 基础**行为** | 轮播、菜单等常规交互 |
| `js/motion.js` | **动效引擎** | 全站滚动动画的统一调度中心 |
| `js/pages.js` | **内页行为** | 目录高亮、顶栏实心、图库灯箱 |

> 入门要点：网页 = 结构（HTML）+ 表现（CSS）+ 行为（JS）。三者分离是行业铁律。

---

## 一之二、页面地图

```
首页 index.html
│
├── 顶部导航 ─┬─ 公园简介 #about（首页锚点）
│             ├─ 代表区域 → areas.html
│             ├─ 公园风光 → scenery.html
│             ├─ 规划旅程 → plan.html
│             ├─ 四季游览 → seasons.html
│             ├─ 公园动态 → news.html
│             └─ 出行锦囊 → tips.html
│
├── 规划旅程 7 张卡 ─┬─ 瀑布指南     → waterfalls.html
│                    ├─ 露营指南     → camping.html
│                    ├─ 园内住宿     → lodging.html
│                    ├─ 许可与预约   → permits.html
│                    ├─ 半穹顶抽签   → permits.html#halfdome
│                    ├─ 防熊安全     → tips.html#bears
│                    └─ 官方 App     → tips.html#app
│
├── 代表区域 2 个按钮 → areas.html#valley / areas.html#mariposa
│
├── 公园动态 4 条 ─┬─ 夏季花讯 → seasons.html#summer
│                  ├─ 实时状况 → news.html#conditions
│                  ├─ 交通管制 → news.html#traffic
│                  └─ 宠物规范 → news.html#pets
│
├── 出行锦囊 5 卡 ─┬─ 许可预约 → permits.html
│                  ├─ 交通管制 → news.html#traffic
│                  ├─ 门票费用 → tips.html#fees
│                  ├─ 安全须知 → tips.html#safety
│                  └─ 官方 App → tips.html#app
│
└── 页脚 2 个入口 ─┬─ 实时状况查询 → news.html#conditions
                  └─ NPS 官方应用 → tips.html#app
```

内页之间还有横向互链（例如 `waterfalls.html` 底部指向 `permits.html#halfdome`、`tips.html#safety`），
`pages.css` 的 `.page-nav` 负责内页的上下篇切换。

### 内页统一骨架

每个内页都由同一套结构拼成，改一处即可全站生效：

```
page-hero（62vh 大图 + 面包屑 + 关键数据条 hero-facts）
   ↓
doc-layout
 ├── 左侧 244px 吸附目录（.doc-toc，滚动自动高亮当前章节）
 └── 右侧正文
      ├── 卡片网格 .card-grid / .info-card
      ├── 图文并排 .media-row（.flip 可左右翻转）
      ├── 提示框 .note（.safety 红 / .info 蓝绿）
      ├── 数据表 table.data（配 .pill 状态标签）
      ├── 瀑布条目 .falls-item（含 fi-stats / fi-tags）
      ├── 图库 .gallery（点击放大，js/pages.js 的 Lightbox）
      └── 事实条 .fact-bar
   ↓
page-nav（上一篇 / 返回首页 / 下一篇）
```

---

## 二、如何本地预览

**方法一：直接打开（最快）**

双击 `index.html` 即可。所有路径都是相对的，双击也能正常显示。

**方法二：本地服务器（推荐）**

某些浏览器对本地文件有安全限制，用服务器更接近真实环境：

```bash
cd yosemite-site

# 有 Python
python -m http.server 8899

# 有 Node.js
npx serve .
```

然后浏览器访问 `http://127.0.0.1:8899`。

---

## 三、设计系统（复刻要点）

所有颜色、字体、间距都定义在 `css/style.css` 顶部的 `:root` 里，这是整个网站的「调色板」。

### 配色

| 变量 | 色值 | 用途 |
|---|---|---|
| `--pine` | `#1B3A2C` | 深松林绿 —— 导航栏、页脚 |
| `--cream` | `#F5F1E6` | 米白 —— 页面主背景 |
| `--cream-2` | `#EFE8D8` | 米白深阶 —— 交替区块背景 |
| `--sequoia` | `#8A5428` | 巨杉棕 —— 英文眉题文字 |
| `--granite` | `#3E423F` | 花岗岩灰 —— 正文 |
| `--lake` | `#27606B` | 高山湖蓝绿 —— 「规划旅程」区块 |
| `--ember` | `#C4622A` | 秋色橙 —— 强调色（按钮、下划线、标签） |
| `--ink` | `#22281F` | 墨色 —— 大标题 |

### 字体

| 变量 | 字体栈 | 用途 |
|---|---|---|
| `--serif` | Noto Serif SC（思源宋体） | 中文标题、卡片名 —— 沉稳、有历史感 |
| `--sans` | Noto Sans SC（思源黑体） | 中文正文 —— 易读 |
| `--latin` | Marcellus | 英文眉题如 `ABOUT YOSEMITE` —— 石刻感罗马体 |

字体通过 Google Fonts 加载（已配置国内镜像 `miaoda.feishu.cn`）。

### 设计规律（看懂这几条就懂整站）

1. **背景在米白和米白深阶之间交替** —— 相邻区块一定不同色，形成节奏感
2. **英文眉题 + 中文大标题** 是固定搭配，营造「国家公园官方感」
3. **秋色橙 `--ember` 极其克制** —— 只出现在按钮、悬停下划线、小标签，绝不滥用
4. **图片一律加暗色渐变遮罩**，保证白色文字在任何照片上都能读清

---

## 三之二、艺术指导：复古国家公园海报 × 旅行杂志编辑感

`css/design-upgrade.css` 是**纯视觉覆盖层**，不改结构、不改脚本。它在 `style.css` / `motion.css` / `pages.css`
之后加载，只做「加法」。整个方向是给站点一个明确的艺术指导，而不是继续堆组件。

### 设计令牌（在原有配色之上叠加）

| 变量 | 色值 | 用途 |
|---|---|---|
| `--du-gold` | `#B07A35` | 赭金 —— 章节编号描边、金线菱形、进度条 |
| `--du-clay` | `#C4622A` | 陶土橙 —— 首字下沉、Tab 选中、角标 |
| `--du-radius` | `15px` | 统一圆角（从直角改为柔和） |
| `--du-shadow` | `0 24px 48px -24px rgba(60,40,20,.28)` | 暖色投影（不再是硬黑影） |
| `--du-shadow-hover` | `0 36px 64px -28px rgba(60,40,20,.36)` | 悬停加深 |

### 三层落地

**① 质感层**

| 手法 | 实现 |
|---|---|
| 纸张颗粒 | 全站 `.grain` 固定层，SVG `feTurbulence` 噪点，`opacity:.05` + `mix-blend-mode:multiply` |
| 统一调色 | 所有照片 `filter:saturate(1.06) contrast(1.03) sepia(.05)`，让不同来源的图像同一部纪录片 |
| 暖色投影 | 卡片阴影统一走 `--du-shadow`，hover 上浮 5–6px |
| 统一圆角 | 全部卡片 / 图框 `--du-radius: 15px` |

**② 编辑版式**

| 手法 | 实现 |
|---|---|
| 不对称网格 | `.about-grid` 与 `.area-card` 改 7fr:5fr，偶数卡自动左右翻转 |
| 更大留白 | `section` 上下内边距 `clamp(96px,11vh,150px)` |
| 杂志行宽 | 正文 `max-width:60ch`（内页 68ch），行高 1.92–1.95 |
| 首字（装饰件） | `.about-lead > p::first-letter`，赭石方章**只占第一行**，不参与正文行盒（详见下方「首字为什么不能用 `::first-letter` 做下沉」） |
| 章节编号 | `.sec-num` 01–07，Marcellus **描边镂空**大字（`-webkit-text-stroke`，填充透明） |
| 石刻数字 | 统计数字改 Marcellus **斜体** `clamp(44px,5.4vw,74px)` + 金色细竖线分隔 |
| 导语块 | About 开篇段落加**四角金线标记**（印刷校对语汇）+ 暖色底，关键年份 `1864` / `1890` 用 Marcellus 加金色下划线挑出 |
| 真实宣传片 | 简介区视频为 NPS 公有领域短片（480p / 3′16″ / 16.7 MB），封面 + 自绘播放键，点击后交还原生控件 |

**③ 主题装饰**

| 手法 | 实现 |
|---|---|
| 公园徽章 | `.badge` 圆形邮戳：外双环 + 顶部弧字 `YOSEMITE` + 半圆顶剪影 + 地面线 + `EST. 1864`；导航 52px、页脚 96px |
| 等高线纹理 | `.deco-ring` 由空心圆环改为多层径向渐变的等高线环线 |
| 金线菱形 | 标题下 `——◆——`（SVG 菱形 + 左右各 82px 细金线），替代原来单纯的英文眉题收尾 |
| 电影画框 | Hero `.hero::after` / 内页 `.page-hero::after` 内缩 14–16px 加 1px 半透明描边 |
| 坐标字幕 | 首页 Hero 四角、内页页头右下角，`37.7456° N` / `EL CAPITAN · 2307m` 纪录片式小字 |
| 描边水印 | `.deco-word` 巨型水印字改描边镂空；页脚加超大 `YOSEMITE` 镂空字收束 |

**④ 克制微交互**

| 手法 | 实现 |
|---|---|
| Ken Burns | 轮播当前图 `scale(1.02→1.11)`，24s 往复 |
| 卡片悬停 | 图片 `scale(1.06–1.08)`，文字从底部渐变升起 |
| 按钮扫光 | 主按钮 hover 一道斜向高光从左扫到右 |
| 阅读进度 | 顶部 2px 赭金细线，`transform:scaleX()` 驱动（`ReadProgress` 模块，挂在 ScrollBus 上） |
| 抽屉错位 | 移动端菜单条目逐条 `translateY(16px)→0` 淡入，间隔 50ms |

### 组件调整

- **悬浮工具栏**：缩小 15%、默认 82% 半透明、加柔和投影，hover 才完全显示
- **规划卡**：底部深色渐变保文字清晰，大卡加「最受欢迎」陶土色角标
- **四季 Tab**：从实心按钮改为「下划线 + 金字」编辑式 Tab
- **内页页头**：从 62vh 收敛到首页 Hero 约 1/3（`clamp(340px,38vh,470px)`），补画框与坐标
- **统计项**：所有项统一左内边距 24px + `::before` 竖条（不再区分首项）
- **About 导语**：四角金线标记 + 暖色底 + 年份下划线，作为整栏的视觉锚点
- **About 右列**：视频框垂直居中

> ⚠️ **做覆盖层时必须知道的坑**（全部踩过）：
> 1. **伪元素要复位上一版的 `transform`**：第一批规则里 `.sec-head h2::after` 带 `transform:rotate(45deg)`（原本是个小菱形块）。
>    第二批要把同一伪元素改成 190px 横线时，**必须显式写 `transform:none`**，否则整条金线会被旋转成斜线。
> 2. **选择器类名先 grep 再写**：抽屉的开合类名是 **`.drawer.open`**，不是 `.is-open`。
>    写错时动画会静默失效（`animation-name` 仍是 `none`），不报错、不警告。
> 3. **特异性会压过加载顺序**：`style.css` 里 `.about-stats div b{display:block}`（0,1,2）
>    高于 `.about-stats b`（0,1,1）。用低特异性选择器时会出现
>    **「同一份声明块里 font-size 生效、display 偏偏不生效」**的诡异现象。
>    症状是「部分属性生效」时，先怀疑特异性，别查语法或加载顺序。
> 4. **`align-items:center` 会让负外边距叠压失效**：曾想用负 margin 让视频框压过区块分隔线，
>    但 grid 是 center，元素被垂直居中，离底部还差 191px，负 margin 够不到。
>    改成 `end` 后确实压过去了（71px），**但代价是视频掉到最底部、上方空出 534px**。
>    因为文字列（778px）远高于视频（348px），「居中」与「压过分隔线」不可兼得 ——
>    **最终选择居中（位置正确优先），放弃叠压**。
> 5. **统计项竖线**：`style.css` 用 `.about-stats div::before` 给**每一项**画竖条，
>    若给第一项 `padding-left:0`，竖条就会紧贴数字。统一左内边距即可。
> 6. **测试用的强制样式会污染判断**：为整屏截图注入的 `[data-reveal] *{opacity:1!important}`
>    会命中 `.video-cap`，导致「封面没隐藏」的假故障。**验证交互时不要注入强制样式。**
> 7. **看设计参考图要分清「设计意图」和「工具画布」**：导语块的参考图是深色底 + 四角标记 + 年份下划线。
>    但深色底多半是那个设计工具的深色画布，不是设计规格 —— 真正可迁移的是**四角标记与年份强调**。
>    直接照搬深色底会与本页的米白基调打架，所以只取装饰语汇、配色仍走站点色板。
>    若确实想要深色块，把 `.about-lead` 的 `background` 换成 `var(--pine)`、文字改 `var(--cream)` 即可。

#### 首字为什么不能用 `::first-letter` 做下沉（本轮踩的坑）

用户要求「"优"字要放在第一行，不要影响到第二行的字体」。看起来是调字号，
实际踩了 **`::first-letter` 的三个隐性行为**，逐个排除后才做对：

| 尝试 | 结果 | 结论 |
|---|---|---|
| 原方案：`float:left` + `line-height:1.92` | 首字行盒 **59.52px** = 2 倍正文行高，压住第二行 | `float` 会把首字算进行盒，必须退出 |
| 改 `position:absolute` + `text-indent` 预留空位 | 段落 **128px**（应为 120px） | `text-indent` 吃掉首行宽度，正文多折一行 |
| 把 `::first-letter` 整个 `display:none` | **仍是 128px** | 证明多出来的高度**与首字无关，是 `text-indent` 造成** |
| 改 `padding-left` + 负 `text-indent` | 122px（对照 122px）| ✅ 每行可用宽度与原来完全一致 |
| 再验 `font-size`：2em vs 1em，其余相同 | 2em → 126px；1em → 122px | **首字字号仍会进入第一行 strut**，撑高行盒 |
| 给首字加 `line-height:0` | **122px = 对照值** | ✅ 彻底退出 strut 竞争 |

**最终写法**（`.about-lead > p` + `::first-letter`）：

```css
.about-lead > p{
  --al-cap:1.82em; --al-cap-gap:.4em;
  padding-left:calc(var(--al-cap) + var(--al-cap-gap));   /* 预留空位 */
  text-indent:calc(-1 * (var(--al-cap) + var(--al-cap-gap))); /* 首行拉回，可用宽度不变 */
  line-height:30px;                                        /* 固定行高 */
}
.about-lead > p::first-letter{
  font-size:var(--al-cap); line-height:0;   /* ★ line-height:0 = 不参与 strut */
  position:absolute; float:none;
  left:clamp(20px,2.4vw,30px); top:clamp(21px,2.3vw,29px);
  width:var(--al-cap); height:var(--al-cap);
  display:flex; align-items:center; justify-content:center;
  font-family:inherit;                       /* 不要换字体族，否则度量不同会撑高 strut */
}
```

**三条可直接复用的规则：**

1. `::first-letter` 做装饰件时，**`line-height:0` 是让它「不参与行盒」的关键**。
   只加 `position:absolute` 不够 —— 字号仍会进入 strut。
2. 预留空位要用 **`padding-left` + 负 `text-indent`**，不要用正的 `text-indent`。
   正缩进会减少首行可用宽度、改变断行；负缩进让每行宽度与原来一致。
3. **不要给 `::first-letter` 换 `font-family`**。换字体（如衬线替无衬线）会改变升降部度量，
   即使 `line-height:0` 已处理字号，字体本身的度量差异仍可能顶高首行。

> **验证方法（可复用到任何「首字不影响正文」的需求）**：
> 在同一段上做 A/B —— 记录原始段落高度，再注入一段把 `::first-letter` 中和
> （`font-size:inherit; position:static; line-height:inherit; border:0; background:none`）
> 并把 `padding-left`/`text-indent` 归零的样式，重测高度。
> **两者必须完全相等**，才算真的「不影响第二行」。
> 已固化在 `_build/functest.js` 的「导语块」断言里，会打印
> `首字对正文行盒影响：有首字 122px vs 去首字 122px`。

### 复跑视觉特写

`_build/zoom.js`、`_build/zoom2.js`、`_build/zoom3.js`、`_build/check3.js` 用于生成局部特写与断言
（导航徽章 / 章节编号 / 统计数字 / 页脚 / 规划卡 / 首字下沉 / 导语块 / 视频播放），便于逐项核对。

---

## 四、页面区块说明

### 首页 `index.html`

| # | 区块 | `id` | 设计要点 |
|---|---|---|---|
| 1 | 顶部导航 | — | 固定定位 `position:fixed`，滚动后背景加深 |
| 2 | Banner 轮播 | `.hero` | 100vh 全屏，3 图淡入淡出 + Ken Burns 缓推 |
| 3 | 警示条 | `#alertBar` | 米黄底 + 橙色三角，可关闭 |
| 4 | 公园简介 | `#about` | 左文右视频，双栏网格 |
| 5 | 代表区域 | `#areas` | 左图右文卡片，偶数项左右翻转 |
| 6 | 公园风光 | `#scenery` | 横向滚动轨道 + scroll-snap 吸附 |
| 7 | 规划旅程 | `#plan` | 湖蓝绿底色，2×3 不规则网格（首卡占 2 行） |
| 8 | 四季游览 | `#seasons` | Tab 切换，4 个面板互斥显示 |
| 9 | 公园动态 | `#news` | 左大图 + 右新闻列表 |
| 10 | 出行锦囊 | `#tips` | 5 列图标卡，悬停上浮 |
| 11 | 页脚 | `.footer` | 深绿三栏 + 版权说明 |
| 12 | 悬浮工具栏 | `.floatbar` | 右下角固定，含返回顶部 |

### 内页（10 个）

| 页面 | 目录章节数 | 核心内容 |
|---|---|---|
| `waterfalls.html` 瀑布指南 | 9 | **旗舰页**。8 行瀑布对照表（落差 / 最佳期 / 难度 / 观景点）+ 5 条瀑布详解（优胜美地 2425ft、弗纳尔 317ft、内华达 594ft、新娘面纱 620ft、瓦沃纳 30ft）+ 6 张"其他值得一看"卡片 + 安全须知 |
| `areas.html` 代表区域 | 8 | 6 行区域对照表 + 7 大区域分述（优胜美地谷 / 图奥勒米草甸 / 瓦沃纳 / 霍奇登草甸 / 冰川点 / 马里波萨巨杉林）+ 按天数 / 按季节的选法 |
| `plan.html` 规划旅程 | 8 | 行前准备清单、最佳季节、交通与入园、行程建议、费用、预订要点 |
| `scenery.html` 公园风光 | 6 | 花岗岩穹丘、瀑布、巨杉、高山草甸、湖泊、观星分类图解 |
| `seasons.html` 四季游览 | 6 | 春 / 夏 / 秋 / 冬四面板，各含看点、路况、装备 |
| `news.html` 公园动态 | 6 | 实时状况、道路与交通、火情与空气质量、施工公告、宠物规范 |
| `tips.html` 出行锦囊 | 7 | 门票费用、安全须知、防熊、高原反应、装备、官方 App、亲子 |
| `camping.html` 露营指南 | 6 | 13 个营地对照表、预订规则、荒野露营许可、营地选择 |
| `lodging.html` 园内住宿 | 5 | 园内酒店 / 木屋 / 营地旅馆对照、预订窗口、园外替代 |
| `permits.html` 许可与预约 | 6 | 入园预约、**半穹顶抽签（`#halfdome`）**、荒野许可、攀岩与商业拍摄、常见问题 |

---

## 五、交互功能清单

### 基础交互（`js/main.js`）

| 模块 | 功能 |
|---|---|
| **Hero** | 自动轮播（5.5 秒）、左右箭头、圆点跳转、键盘 ←→、悬停暂停、移动端滑动切换、切后台自动暂停 |
| **Drawer** | 移动端全屏抽屉菜单，点击链接 / ESC 自动关闭，开启时锁定页面滚动 |
| **Seasons** | 四季 Tab 互斥切换 |
| **Toast** | 统一接管所有 `data-toast` 属性元素，点击弹出轻提示（现仅用于搜索按钮和视频播放按钮） |
| **ToTop** | 滚动超过 600px 后淡入出现 |
| **Nav** | 滚动时顶栏加深；自动高亮当前所在区块 |
| **AlertBar** | 警示条关闭 |
| **SmoothAnchor** | 平滑锚点跳转，自动扣除固定导航高度 |

### 内页脚本（`js/pages.js`）

只在 10 个内页加载，与 `main.js` / `motion.js` 配合工作：

| 模块 | 功能 |
|---|---|
| **Toc** | 左侧目录滚动高亮（scroll-spy）+ 点击平滑跳转，自动扣除 74px 导航高度 |
| **Header** | 内页顶栏恒为实心态（`.topbar.is-solid`），滚动后加 `scrolled` 阴影 |
| **Lightbox** | 图库点击放大，支持 ← → 切换、ESC 关闭、遮罩点击关闭 |
| **Fallback** | 兜底：若 `motion.js` 未加载或用户开启「减少动态效果」，直接把所有 `[data-reveal]` 置为可见 |

### 动效引擎（`js/motion.js`）

这是本次的重点。**不是给每个元素单独加动画**，而是一套统一调度的滚动动画系统。

| 模块 | 效果 |
|---|---|
| **ScrollBus** | 全站唯一的 rAF 循环。所有滚动动效共用一次读写，避免 N 个独立监听造成的布局抖动 |
| **Parallax** | 视差层。元素的 `data-parallax` 值即位移强度，随滚动飘移形成纵深 |
| **Reveal** | 区块错峰入场。支持 7 种方向（上/下/左/右/缩放/模糊/遮罩），容器内自动错峰（55ms 间隔，上限 260ms） |
| **Counter** | 数字滚动计数（1864 / 3080 从 0 缓动到位，54px 衬线大字 + 橙色竖条） |
| **Rail** | 风光横向轨道。**独立滚动**，与页面纵向滚动完全解耦（见下方说明） |
| **ProgressRail** | 右侧章节圆点指示器，滚动高亮 + 点击跳转，进入页脚自动反色 |
| **Header** | 顶栏三态状态机：`hero` 透明浮层 → `compact` 收缩转实 → `hidden` 下滚收起 / 上滚召回 |
| **Magnetic** | 磁性按钮，光标靠近时朝光标方向位移并阻尼回弹 |
| **SplitText** | 章节标题逐字浮现（26ms 间隔） |
| **CursorSpot** | 卡片光斑跟随光标位置 |
| **ReadProgress** | 顶部 2px 赭金阅读进度线，`transform:scaleX()` 驱动，变化小于 0.2% 不写 DOM |

#### 设计原则

1. **单一 rAF 循环** —— 全站滚动动效共用一次读写，不做 N 个独立 `scroll` 监听
2. **只动 `transform` / `opacity`** —— GPU 合成，绝不触发重排
3. **视口外自动停机** —— `IntersectionObserver` 标记可见性，不可见的元素不参与计算
4. **写入前先比对** —— 位移变化小于 0.5px 就不写 DOM（横向轨道用此策略）
5. **全站尊重 `prefers-reduced-motion`** —— 开启时直接关闭引擎，内容全部直接可见

#### 如何在 HTML 里使用

```html
<!-- 错峰入场：容器加 group，子项加 reveal -->
<div data-reveal-group>
  <h2 data-split>标题逐字浮现</h2>
  <p data-reveal="up">从下方上浮</p>
  <p data-reveal="blur">从模糊到清晰</p>
</div>

<!-- 图片遮罩掀开 -->
<div class="img-mask" data-reveal="mask"><img src="..." alt=""></div>

<!-- 视差层：数值越大位移越明显 -->
<div class="deco-layer deco-word" data-parallax="0.5">Yosemite</div>

<!-- 数字计数 -->
<span data-count="1864">1864</span>

<!-- 磁性按钮 / 光斑卡片 -->
<a class="btn btn-primary" data-magnetic>按钮</a>
<div class="plan-card" data-spot>卡片</div>
```

### 性能实测

| 指标 | 结果 |
|---|---|
| 30 次连续滚动步进 | 180ms（约 6ms/帧） |
| Long Task（长任务） | 0 个 |
| JS 报错 | 0 个 |
| 横向溢出（1440 / 1024 / 390 / 320px） | 无 |

### 实测截图

`screenshots/` 目录下有 17 张首页实测截图，可直接用于效果核对或向外征集设计评分：

| 文件 | 内容 |
|---|---|
| `00-fullpage.jpg` | 桌面 1440px 整页长图（一张看完） |
| `01`–`09` | 桌面端逐区块：首屏 / 简介 / 区域 / 风光 / 旅程 / 四季 / 动态 / 锦囊 / 页脚 |
| `10`–`12` | 移动端 390px：首屏 / 中部卡片 / 四季区 |
| `13`–`14` | 风光轨道独立滚动实测 |
| `15`–`16` | 公园简介数据大字（桌面 / 移动） |

内页截图可用 `_build/verify.js` 重新生成（输出到 `_build/shots/`）。

### 自动化实测结果

用 `_build/verify.js` + `_build/functest.js`（Playwright 驱动 Edge 无头浏览器）实测：

| 项目 | 结果 |
|---|---|
| 页面 × 视口组合 | 33（11 页 × 1440 / 820 / 390px） |
| 页面可加载 | **33 / 33** |
| 横向溢出 | **0** |
| JS 报错 / 网络错误 | **0** |
| 破图 | **0** |
| 内页目录（TOC） | 10 页全部存在，`waterfalls.html` **9/9** 目录项跳转与高亮同步正确 |
| 四季 Tab 切换 | **4 / 4** 面板正确切换，图片均已预载无空白 |
| 图库灯箱 | 打开 / 换图 / ESC 关闭全部正常 |
| 全站内链 | **412 条**（含 164 个锚点）**全部可达，0 死链** |

视觉升级专项（`functest.js` 第 5 组）：

| 项目 | 实测值 |
|---|---|
| 阅读进度条 | `scaleX` 顶部 0 → 半程 0.537 → 到底 **0.999** |
| 公园徽章 | 导航 **52px** / 页脚 **96px**，均已渲染 |
| 视频框居中 | About 右列视频框垂直居中，上留白 250px / 下留白 250px |
| 导语块 | 四角标记均 1px、年份 `1864`/`1890` 为 Marcellus + 金色下划线、首字 1.82em 方章 |
| 首字不影响正文 | 有首字 **122px** vs 去首字 **122px**（桌面/移动完全相等）—— 第二行未被影响 |
| 视频可播放 | 点击后 `paused=false`、时间推进（t>0）、画面 854×480、控件已交还、封面正确隐藏 |
| 统计项间距 | 两项数字距左边缘均为 **24px**（此前第一项被置 0，竖线紧贴数字） |
| 章节编号 | 54px、`-webkit-text-stroke:1px`、填充色透明（确为镂空） |
| 金线菱形 | `transform:none`（未被旋转）、宽 190px、含菱形 SVG |
| 抽屉错位 | 逐条 `drawer-item-in`，延迟 0.06 / 0.11 / 0.16 / 0.21s |
| 颗粒层 | `opacity:0.05`、`mix-blend-mode:multiply`、噪点 SVG 已加载 |

---

## 五之二、风光轨道为什么不再跟着页面滚

早期版本让「公园风光」横向轨道随页面纵向滚动自动推进。问题有两个：

1. **失控感** —— 用户想上下浏览，轨道却在偷偷滑走，想回头找某张卡片时位置已经变了
2. **抢交互** —— 页面滚动和轨道滚动绑在一起，用户想手动横滑时被两者拉扯干扰

现在改成**完全独立**：上下滚动页面时轨道**一动不动**，只响应用户自己的横向操作。

| 操作 | 行为 |
|---|---|
| 触摸横滑 | 原生滚动（移动端） |
| 触控板双指横滑 | 原生横向滚动 |
| 鼠标滚轮 | 在轨道上方滚动时转成横向推进；**滑到两端后自动放行**，页面恢复纵向滚动（不"吃掉"滚轮） |
| 鼠标拖拽 | 按住拖动，`cursor: grab/grabbing`，拖拽中屏蔽卡片悬停与误点击 |
| 方向键 ← → | 聚焦轨道后可用，每次推进一张卡片（322px） |

另有首尾渐隐遮罩：滑到最左/最右时对应的渐隐条自动消失（`:has()` + `.at-start` / `.at-end`）。

> ⚠️ 实现细节：由于轨道有 `padding: 4%`，`scrollLeft` 的真正最小值**不是 0**（实测约 57px，首卡会吸附到 padding 边缘），
> 且浏览器会把负的 `scrollLeft` 直接钳制掉，无法用赋负值探测。因此 JS 从计算样式的 `padding-left` 推导最小值来判断 `at-start`。

### 揭示速度

图片和区块的入场动效已统一加快：

| 项目 | 调整前 | 调整后 |
|---|---|---|
| 透明/位移时长 | 0.85s / 0.95s | **0.52s / 0.58s** |
| 遮罩掀开 | 1.1s | **0.68s** |
| 图片缩放回落 | 1.5s | **0.8s** |
| 容器内错峰间隔 | 90ms（无上限） | **55ms（上限 260ms）** |

需要单独微调某个元素时，可以直接写 `data-reveal-delay="180"`（毫秒），优先级高于自动错峰。

---

## 六、响应式断点

### 首页

| 断点 | 变化 |
|---|---|
| **> 960px** | 桌面三栏 / 双栏布局，横向导航 |
| **≤ 960px** | 导航收进汉堡菜单；简介、区域卡片、四季面板、动态全部改为单栏；规划网格变 2 列；锦囊变 2 列 |
| **≤ 480px** | 规划网格变 1 列；字体整体缩小；悬浮工具栏悬停气泡隐藏（避免溢出）；轮播箭头隐藏（改用滑动手势） |

### 内页（`css/pages.css`）

| 断点 | 变化 |
|---|---|
| **> 1024px** | 左侧 244px 吸附目录 + 右侧正文双栏 |
| **≤ 1024px** | 目录**折叠成顶部横向胶囊条**（可横滑），正文单栏；`media-row` 取消左右翻转 |
| **≤ 780px** | 卡片网格降为单列；表格改为可横滑容器；页头高度从 62vh 降到 46vh |
| **≤ 480px** | 字号整体下调；图库变单列；事实条纵向堆叠 |

已实测 **1440px / 820px / 390px** 三种宽度 × 11 个页面 = **33 个组合，全部无横向溢出**。

---

## 七、下一步可以做什么

### 1. 替换图片素材
`assets/` 里的图片可以直接替换，**保持文件名不变即可**，不用改任何代码。建议：
- 轮播大图：1920×1080 以上
- 风光卡图：600×760（2 倍图）
- 卡片配图：1200×800 左右
- 内页页头大图：1920×1080 以上（复用现有 banner 图）

### 2. 增加新内页（可选）
`_build/` 里保留了生成脚本。新增一页最省事的做法是**复制一个现有内页**，改三处：
1. `<title>` 和 `.page-hero` 里的标题、面包屑
2. `.doc-toc` 里的目录项（`href="#xxx"`）和正文各 `<section id="xxx">`
3. `.page-nav` 的上下篇链接

> 若要批量生成，可参考 `_build/gen_common.py`（共享外壳）+ `_build/gen_pages.py`（各页内容）。
> 运行方式：`python _build/gen_pages.py`，产物直接写入站点根目录。
> 注意：`_build/` 只是开发辅助，**上线时可以不部署**。

### 3. 发布到 GitHub Pages（对应仓库名 `han-fernando.github.io`）
```bash
cd yosemite-site
git init
git add .
git commit -m "feat: 优胜美地中文信息站"
git branch -M main
git remote add origin https://github.com/han-fernando/han-fernando.github.io.git
git push -u origin main
```
推送后访问 `https://han-fernando.github.io`。

### 4. 性能优化（进阶）
- 把 `banner-valley.jpg`（当前 1920×685）压缩到 300 KB 以内，或用 WebP
- 大图加 `loading="lazy"`（已对非首屏图片配置）
- 把字体改为本地 `@font-face`，去掉对 CDN 的依赖

---

## 八、待办 / 已知问题

- [ ] `assets/animal.png`（3.6 MB）是一张 AI 生成的猫图，与主题不符，当前**未被引用**，可直接删除。
- [ ] `assets/feat-wildlife.jpg` 是 `feat-lodge.jpg` 的副本（均为 916 KB），原设计此处应为「野生动物」卡片。建议替换为真实的黑熊或野生动物照片，并压缩到 300 KB 以内。
- [ ] `feat-lodge.jpg` 体积 916 KB 偏大，建议压缩。
- [ ] `assets/yosemite-film.mp4` 为 **16.7 MB**，是站内最大的单个文件。已设 `preload="none"`，
  首屏不会下载；若后续要严格控制体积，可转成 720p 以下的自适应码率版本或改用 CDN 分发。
  片源为 NPS 出品的公有领域素材（`Yosemite Stock Footage 2009`），可自由使用。
- [ ] 所有外链均指向 nps.gov 官方页面；上线前请确认链接有效性。
- [ ] 内页页头大图目前复用首页 banner 图，后续可替换为更贴合各栏目主题的照片。
- [ ] 本站为信息参考站，内容编译自 NPS 公开资料，**非官方网站**，页脚已声明。
- [x] ~~`css/preview-force.css` 会强制把揭示元素拉到落地态（`transform:none`），**上线前必须删除**。~~
      已从全部页面移除；整屏截图所需的强制态改为由 `_build/verify.js` 在截图前临时注入，页面本身保留完整动画。
- [ ] 徽章上的弧字在小尺寸（52px 导航栏）下仅作装饰，可辨识但不精确；如需完全可读，建议改为纯图形徽标 + 独立文字。
- [ ] 仓库里还留着两个**开发期临时目录**，上线前可直接删除，不影响站点运行：
      `_design_preview/`（约 44 MB，设计升级前的旧整页截图）与 `_design_backup/`（约 100 KB，旧版 index.html + css）。
      站点真正需要部署的只有：11 个 `.html`、`css/`、`js/`、`assets/`。
- [ ] 无法获取豆包美学评分（需登录），需人工贴图评审。

---

## 九、开发约定

如果后续要继续维护这个项目，建议遵守：

1. **不要写内联事件**（`onclick=`），统一用 `data-*` 属性 + JS 绑定
2. **不要硬编码颜色**，一律用 `var(--变量名)`
3. **首页样式加到 `style.css`，内页样式加到 `pages.css`**，不要互相污染
4. **新内页必须复用同一套骨架**（`page-hero` → `doc-layout` → `page-nav`），并在 `pages.js` 的目录里登记
5. **修改后至少在 390px、820px、1440px 三个宽度各看一遍**
6. 中文排版注意：中英文之间加空格，标点用中文全角
7. 内页图片**别用 `loading="lazy"` 放在 `display:none` 的面板里** —— 浏览器永远不触发加载。
   参考 `js/main.js` 的 `Seasons.preloadHidden()`：空闲时主动预载，兼顾首屏速度与切换体验。

---

## 十、如何重新跑一遍实测

```bash
# 依赖（只需一次）——装进隔离工作区，不污染全局
cd "C:/Users/22289/.workbuddy-ai/binaries/node/workspace"
"C:/Users/22289/.workbuddy-ai/binaries/node/versions/22.22.2-3/node.exe" \
  "C:/Users/22289/.workbuddy-ai/binaries/node/versions/22.22.2-3/node_modules/npm/bin/npm-cli.js" \
  install playwright-core --no-audit --no-fund

# 全站三视口体检（连通性 / TOC / 破图 / 溢出 / 报错）+ 截图
cd "C:/Users/22289/Desktop/project/yosemite-site/_build"
NODE_PATH="C:/Users/22289/.workbuddy-ai/binaries/node/workspace/node_modules" \
  "C:/Users/22289/.workbuddy-ai/binaries/node/versions/22.22.2-3/node.exe" verify.js

# 功能交互实测（Tab / 目录 / 灯箱 / 内链 / 阅读进度 / 叠压 / 抽屉）
NODE_PATH="C:/Users/22289/.workbuddy-ai/binaries/node/workspace/node_modules" \
  "C:/Users/22289/.workbuddy-ai/binaries/node/versions/22.22.2-3/node.exe" functest.js

# 视觉特写（导航徽章 / 章节编号 / 统计数字 / 页脚 / 规划卡）
NODE_PATH="C:/Users/22289/.workbuddy-ai/binaries/node/workspace/node_modules" \
  "C:/Users/22289/.workbuddy-ai/binaries/node/versions/22.22.2-3/node.exe" zoom.js
NODE_PATH="C:/Users/22289/.workbuddy-ai/binaries/node/workspace/node_modules" \
  "C:/Users/22289/.workbuddy-ai/binaries/node/versions/22.22.2-3/node.exe" zoom2.js

# 量出 About→Areas 的叠压像素
NODE_PATH="C:/Users/22289/.workbuddy-ai/binaries/node/workspace/node_modules" \
  "C:/Users/22289/.workbuddy-ai/binaries/node/versions/22.22.2-3/node.exe" overlap.js

# 重新注入设计升级 / 重建徽章（改完 HTML 结构后跑）
python _build/apply_design.py
python _build/rebuild_badge.py
```

脚本用**系统自带的 Edge**（无需下载 Chromium），默认走 `file://` 协议，
**不需要启动本地服务器**（用 `BASE=http://127.0.0.1:8899/ node verify.js` 可切回 HTTP）。
截图输出到 `_build/shots/`。

> 整屏截图需要元素处于「落地态」。**不要再把强制态写成 CSS 文件塞进页面**（会杀死线上动画），
> 正确做法是 `verify.js` 在截图前用 `page.addStyleTag()` 临时注入。

---

*最后更新：2026-10-03*
