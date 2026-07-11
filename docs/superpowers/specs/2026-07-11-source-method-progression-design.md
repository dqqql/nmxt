# 道源升级与法门感悟显式分组设计

## 背景

当前角色卡构建器里，道源升级选项与法门感悟主要依赖既有数组顺序和境界前缀推导：

- 道源初始神通 / 秘法通过 `sources.json` 的第 1 项预填。
- 道源升级神通 / 秘法通过 `slice(1)` 等方式从剩余条目里取值。
- 法门感悟展示通过 `getFirstRealmInsight()` 自动取当前境界的第一张感悟。
- 升级弹窗只在练气后期、筑基前期、筑基后期要求选择感悟，缺少“首次选择法门时选择初始感悟”的流程。

这套逻辑无法满足资源表中的显式规则：

- 每个道源在练气中期应有固定的 2 选 1 神通池。
- 每个道源在筑基中期应有固定的 2 选 1 神通池与 2 选 1 秘法池。
- 每个法门的可选感悟卡应按阶段分组，且不同法门可选池不同。
- 首次选择法门时需要立刻弹窗选择 1 张初始感悟。
- 切换法门时，需要清空旧法门带来的感悟并重新弹出初始感悟选择。

本次改造以 `D:\Dql\Desktop\逆命仙途先行版车卡器资源.md` 为唯一规则来源。

## 目标

1. 让所有道源的初始、练气中期、筑基中期可选神通 / 秘法都严格按资源表驱动。
2. 让所有法门的初始感悟、练气后期感悟、筑基后期感悟、本源感悟都严格按资源表驱动。
3. 在首次选择法门与切换法门时，统一通过弹窗显式选择初始感悟。
4. 保持现有升级弹窗、回退境界、第二页卡表展示、自动存档能力不退化。

## 非目标

1. 不改动道源、法门、大道、灵宝的视觉样式。
2. 不重做升级弹窗组件，只在现有弹窗结构上扩展。
3. 不改动境界突破数值效果，如阈值、灵气格、核心属性等。

## 数据设计

### 道源数据

将 `src/data/sources.json` 由“单一 `skills` / `arts` 数组按顺序隐式分段”，改为“按阶段显式分组”。

每个道源使用如下结构：

```json
{
  "name": "金道源",
  "initialSkill": { "name": "金芒术", "text": "..." },
  "qiUpgradeSkills": [
    { "name": "金罡斩", "text": "..." },
    { "name": "锋芒毕露", "text": "..." }
  ],
  "foundationUpgradeSkills": [
    { "name": "金锋化刃", "text": "..." },
    { "name": "金芒连刺", "text": "..." }
  ],
  "initialArt": { "name": "金芒破元斩", "text": "..." },
  "foundationUpgradeArts": [
    { "name": "庚金破法诀", "text": "..." },
    { "name": "金戈镇妖诀", "text": "..." }
  ]
}
```

兼容策略：

- 如界面代码仍需要用于资源库预览的完整列表，可在数据导出层派生出旧形态聚合数组：
  - `skills = [initialSkill, ...qiUpgradeSkills, ...foundationUpgradeSkills]`
  - `arts = [initialArt, ...foundationUpgradeArts]`
- 升级逻辑不再依赖聚合数组顺序，只读取显式字段。

### 法门数据

将 `src/data/methods.json` 中现有的 `insights` 与 `originInsights` 进一步显式分组。

每个法门使用如下结构：

```json
{
  "name": "剑修",
  "qiInitialInsights": [
    { "name": "练气·剑感初开", "text": "..." },
    { "name": "练气·气贯剑身", "text": "..." }
  ],
  "qiUpgradeInsights": [
    { "name": "练气·步随剑走", "text": "..." },
    { "name": "练气·剑心通明", "text": "..." }
  ],
  "foundationInsights": [
    { "name": "筑基·御剑攻敌", "text": "..." },
    { "name": "筑基·剑气破体", "text": "..." },
    { "name": "筑基·剑影分身", "text": "..." },
    { "name": "筑基·识剑心明", "text": "..." }
  ],
  "originInsights": [
    { "name": "练气本源·剑气初成", "text": "..." },
    { "name": "练气本源·剑势凝一", "text": "..." },
    { "name": "筑基本源·剑光分化", "text": "..." },
    { "name": "筑基本源·人剑合一", "text": "..." }
  ]
}
```

规则约束：

- `qiInitialInsights`：首次选法门时 2 选 1。
- `qiUpgradeInsights`：练气后期 2 选 1。
- `foundationInsights`：筑基后期从筑基感悟池中选择 1 张。当前资源表未要求“筑基初期额外普通感悟”，因此只在筑基后期弹出。
- `originInsights`：保留现有阶段筛选逻辑，但改成显式按名称前缀或独立分组读取：
  - 练气后期 -> 筑基前期突破时，从筑基本源感悟池里选 1。
  - 筑基后期 -> 金丹突破时，如后续继续保留，再从筑基本源感悟池里选 1。

兼容策略：

- 如第二页“感悟概览”或其他界面仍需要完整感悟列表，可在数据导出层派生：
  - `insights = [...qiInitialInsights, ...qiUpgradeInsights, ...foundationInsights]`

## 升级与开卡流程

### 道源相关

- 角色首次选择道源后：
  - 神通表预填 `initialSkill`
  - 秘法表预填 `initialArt`
- 练气前期 -> 练气中期：
  - 弹窗展示 `qiUpgradeSkills`
  - 玩家 2 选 1，写入升级选择记录
- 筑基前期 -> 筑基中期：
  - 弹窗展示 `foundationUpgradeSkills`
  - 同一弹窗展示 `foundationUpgradeArts`
  - 玩家分别 2 选 1，写入升级选择记录

### 法门相关

- 首次选择法门后：
  - 立即弹窗展示 `qiInitialInsights`
  - 玩家 2 选 1，写入升级选择记录
- 练气中期 -> 练气后期：
  - 弹窗展示 `qiUpgradeInsights`
  - 同时保留大道功法选择
- 练气后期 -> 筑基前期：
  - 保留现有突破属性加成
  - 弹窗展示筑基本源感悟候选
- 筑基中期 -> 筑基后期：
  - 弹窗展示 `foundationInsights`
  - 同时保留大道筑基功法选择

## 切换法门行为

当用户在任意时点修改法门选择时：

1. 清空所有由旧法门带来的感悟记录，包括：
   - 初始练气感悟
   - 练气后期感悟
   - 筑基后期感悟
   - 本源感悟
2. 不清理非感悟内容：
   - 道源神通 / 秘法
   - 灵宝
   - 大道功法
3. 立刻弹出新法门的初始感悟选择弹窗。
4. 若用户取消弹窗，则法门仍然已经切换成功，但感悟区域保持空缺，直到重新完成选择。

## 状态设计

继续复用 `upgradeChoices` 作为统一的“阶段选择记录”，但扩展目标类型。

建议新增或明确以下 target：

- `skills`
- `arts`
- `insights`
- `originInsights`
- `daoMethods`
- `treasures`
- `extraMethods`
- `initialInsights`

也可以不新增 `initialInsights`，而是统一并入 `insights`，但需要在 choice 上额外记录来源或 prompt key，以便切换法门时只清理法门相关项。推荐直接新增字段：

```js
{
  realmIndex: 0,
  target: 'initialInsights',
  sourceKind: 'method',
  card: { name: '练气·剑感初开', text: '...' }
}
```

`upgradeChoices` 记录至少需要支持：

- `realmIndex`
- `target`
- `card`
- `sourceKind`，用于区分来自法门 / 道源 / 大道 / 灵宝
- 可选 `promptKey`，用于后续精确清理或去重

## 展示设计

### 第二页卡表

第二页“感悟”表不再通过 `getFirstRealmInsight()` 自动补第一张。

改为：

- 初始感悟展示来自 `upgradeChoices.initialInsights`
- 后续练气 / 筑基感悟展示来自 `upgradeChoices.insights`
- 本源感悟展示来自 `upgradeChoices.originInsights`

这样卡面会严格反映玩家实际选择，而不是“该法门某阶段的默认第一张”。

### 升级弹窗

沿用现有 `UpgradeSelectionModal`：

- 初始感悟弹窗复用同一组件，只是标题改为“初始感悟选择”。
- 每个分区继续由 `sections` 描述。
- “稍后再选”按钮保留。

## 代码改造范围

### `src/data/sources.json`

- 将每个道源拆为显式阶段字段。
- 补全所有道源的练气中期 / 筑基中期神通与筑基中期秘法。

### `src/data/methods.json`

- 将每个法门的感悟拆为初始练气感悟、练气后期感悟、筑基感悟、本源感悟。
- 资源内容严格参照资源 md 第四页及相关法门条目。

### `src/data/index.js`

- 如有必要，增加兼容导出，将新结构聚合回旧的展示数组。

### `src/realmUpgrade.js`

- 新增显式读取函数：
  - `getInitialSourceSkills`
  - `getInitialSourceArts`
  - `getSourceQiUpgradeSkills`
  - `getSourceFoundationUpgradeSkills`
  - `getSourceFoundationUpgradeArts`
  - `getMethodInitialInsights`
  - `getMethodQiUpgradeInsights`
  - `getMethodFoundationInsights`
- `createUpgradeStep()` 改为读取显式字段，而不是 `slice()` 或前缀筛选的隐式约定。

### `src/methodProgression.js`

- 移除“自动取第一张感悟作为卡面默认值”的职责。
- 如仍需要法门阶段辅助函数，仅保留攻击增益阶段逻辑。

### `src/main.jsx`

- 法门选择变更时，加入“清除旧法门相关感悟 + 打开初始感悟弹窗”的行为。
- 第二页 `prefillFor('感悟')` 改为读取真实选择结果。
- `appendUpgradeCards()` 与清理函数支持更细粒度 target / sourceKind。

## 测试要求

### `src/realmUpgrade.test.js`

补充或重写以下断言：

1. 金道源练气中期神通选项应为：
   - `金罡斩`
   - `锋芒毕露`
2. 金道源筑基中期神通选项应为：
   - `金锋化刃`
   - `金芒连刺`
3. 金道源筑基中期秘法选项应为：
   - `庚金破法诀`
   - `金戈镇妖诀`
4. 任一道源初始神通 / 秘法不应混入升级池。

### 法门与感悟测试

新增测试覆盖：

1. 首次选择剑修时，初始感悟池应为：
   - `练气·剑感初开`
   - `练气·气贯剑身`
2. 剑修练气后期感悟池应为：
   - `练气·步随剑走`
   - `练气·剑心通明`
3. 剑修筑基后期感悟池应为 4 张筑基感悟。
4. 切换法门后，旧法门相关感悟记录应被清理。
5. 切换法门后，应重新弹出初始感悟选择 prompt。

### 展示回归

验证第二页：

1. 未选择初始感悟时，“感悟”表不应自动出现默认卡。
2. 选择初始感悟后，“感悟”表应只展示已选卡。
3. 练气后期、筑基后期追加选择后，展示应累积。

## 实施顺序

1. 重构 `sources.json` 为显式阶段字段。
2. 重构 `methods.json` 为显式阶段字段。
3. 更新 `realmUpgrade.js` 数据读取与升级规则。
4. 更新 `main.jsx` 的法门切换与初始感悟弹窗逻辑。
5. 更新第二页展示逻辑，移除自动默认感悟。
6. 增补并修正测试。
7. 按资源表抽查至少 2 个道源与 2 个法门，确认分组无错位。

## 风险与缓解

### 风险 1：资源表与现有 JSON 条目数量不一致

缓解：

- 以资源 md 为准补全缺失条目。
- 若某法门 / 道源现有 JSON 缺项，直接在本次数据改造中补齐。

### 风险 2：旧代码仍依赖 `skills` / `arts` / `insights` 聚合数组

缓解：

- 在数据导出层保留兼容聚合字段。
- 只把“选择逻辑”切到显式字段。

### 风险 3：切换法门时误删其他升级选择

缓解：

- 在 `upgradeChoices` 上增加 `sourceKind` 或 `promptKey`。
- 清理时只删除 `sourceKind === 'method'` 的感悟类记录。

## 验收标准

1. 任意道源在练气中期、筑基中期打开的神通 / 秘法选项与资源表完全一致。
2. 首次选法门后必定弹出初始感悟选择。
3. 切换法门后旧感悟被清除，并重新弹出初始感悟选择。
4. 第二页“感悟 / 本源感悟”只显示玩家真实选择结果。
5. 回退境界后，高境界获得的感悟 / 神通 / 秘法仍按现有规则正确裁剪。
