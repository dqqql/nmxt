# 法门感悟分期与展示同步设计

## 背景

当前角色卡构建器已经把道源、法门、大道等规则文本集中在 `src/data/*.json`，并通过 `realmUpgrade.js`、`methodSelectionFlow.js`、`methodProgression.js` 分别处理升级选项、首次法门感悟选择、法门攻击增益展示。

本次检查发现，旧实现把每个法门的练气感悟拆成：

- `qiInitialInsights`：初始 2 张。
- `qiUpgradeInsights`：练气后期 2 张。

但资源原文 `D:\Dql\Desktop\逆命仙途先行版车卡器资源.md` 写的是：

- 每个法门有「练气期四张可选感悟卡」。
- 初次选择法门时，应从这 4 张练气感悟里选择 1 张。
- 升到练气后期时，应从剩余 3 张练气感悟里再选择 1 张。

以剑修为例：

- 入门普攻强化只有「剑势凛冽」。
- 练气感悟共有「剑感初开」「气贯剑身」「步随剑走」「剑心通明」4 张。
- 练气后期选择池应排除初始已经选择的那一张。
- 筑基后期再从筑基感悟 4 张里选择。

引导车卡目前也直接展示 `attackBuffs.slice(0, 2)` 与 `insights.slice(0, 2)`，导致练气阶段显示了筑基攻击增益，并且只显示两张练气感悟。第二页卡面则保留了 `练气·` 等前缀，不符合最新展示要求。

## 目标

1. 以 `method.insights` 作为法门普通感悟的唯一事实来源。
2. 初次选择法门时，从全部练气感悟 4 张里选择 1 张。
3. 升到练气后期时，从练气感悟 4 张中排除已选初始感悟，剩余 3 张可选。
4. 筑基后期时，从筑基感悟 4 张里选择 1 张。
5. 攻击增益按修为阶段解锁：练气只显示入门普攻强化，筑基及以上显示进阶普攻强化。
6. 第二页、升级弹窗、引导车卡等所有感悟卡展示名均去掉阶段前缀，只保留卡名本体。
7. 主流程、问卷车卡、引导车卡共享同一套法门感悟规则。
8. 检查并补齐测试，覆盖所有法门分期数据完整性和剑修代表流程。

## 非目标

1. 不重构道源 `sources.json` 的显式阶段字段，本次仅检查不破坏现有道源升级池。
2. 不重做升级弹窗视觉结构。
3. 不改变境界突破数值效果，如阈值、灵气格、核心属性等。
4. 不改变资源 md 原文，只把应用行为与原文对齐。

## 方案

采用方案 2：新增规则 helper，统一从完整池按阶段和已选项计算，不继续依赖 `qiInitialInsights` / `qiUpgradeInsights` 作为法门感悟事实来源。

### 数据来源

`src/data/methods.json` 保留现有聚合字段：

- `attackBuffs`
- `insights`
- `originInsights`

普通感悟分期通过 `insights` 名称前缀判断：

- `练气·`：练气普通感悟。
- `筑基·`：筑基普通感悟。

本源感悟分期通过 `originInsights` 名称前缀判断：

- `练气本源·`：练气本源感悟。
- `筑基本源·`：筑基本源感悟。

旧字段 `qiInitialInsights`、`qiUpgradeInsights`、`foundationInsights` 不再作为选择逻辑来源。为降低本次风险，可以先保留这些字段以兼容其他展示代码，但新增测试会确保规则 helper 不读取它们。

### 规则 Helper

在现有 helper 层增加或调整以下能力：

- `getMethodQiInsights(method)`：返回全部 `练气·` 普通感悟，应为 4 张。
- `getMethodFoundationInsights(method)`：返回全部 `筑基·` 普通感悟，应为 4 张。
- `getMethodInitialInsights(method)`：等同 `getMethodQiInsights(method)`，用于初始 4 选 1。
- `getMethodQiUpgradeInsights(method, selectedInitialInsights)`：返回练气感悟中未被初始选择占用的剩余项，应为 3 张。
- `getMethodQiOriginInsights(method)`：返回 `练气本源·` 感悟，应为 2 张。
- `getMethodFoundationOriginInsights(method)`：返回 `筑基本源·` 感悟，应为 2 张。
- `formatCardDisplayName(nameOrCard)`：去掉展示前缀，只保留卡名本体。

`formatCardDisplayName()` 需要移除：

- `练气·`
- `筑基·`
- `练气本源·`
- `筑基本源·`

示例：

- `练气·剑感初开` -> `剑感初开`
- `筑基·御剑攻敌` -> `御剑攻敌`
- `练气本源·剑气初成` -> `剑气初成`
- `筑基本源·剑光分化` -> `剑光分化`

## 流程设计

### 首次选择法门

用户在主界面选择法门时：

1. 更新当前法门。
2. 清理旧法门带来的感悟选择：
   - `initialInsights`
   - `insights`
   - `originInsights`
3. 打开「初始感悟选择」弹窗。
4. 弹窗选项来自 `getMethodInitialInsights(method)`，即练气 4 张。
5. 玩家选择 1 张后写入 `upgradeChoices`：

```js
{
  realmIndex: defaultRealmIndex,
  target: 'initialInsights',
  sourceKind: 'method',
  promptKey: 'initial-method-insight',
  card
}
```

如果玩家点击「稍后再选」，法门仍保留，感悟区域保持空缺；后续进入主界面时仍可根据缺失状态重新提示。

### 练气后期升级

从练气中期升到练气后期时：

1. 读取当前法门。
2. 从 `upgradeCards.initialInsights` 得到已选初始感悟。
3. 调用 `getMethodQiUpgradeInsights(method, upgradeCards.initialInsights)`。
4. 弹窗展示剩余 3 张练气感悟。
5. 玩家选择 1 张后写入 `target: 'insights'`。
6. 同一升级弹窗继续保留大道练气功法选择。

以剑修为例，如果初始已选「剑感初开」，练气后期候选应为：

- `气贯剑身`
- `步随剑走`
- `剑心通明`

### 筑基后期升级

从筑基中期升到筑基后期时：

1. 调用 `getMethodFoundationInsights(method)`。
2. 展示筑基普通感悟 4 张。
3. 玩家选择 1 张后写入 `target: 'insights'`。
4. 同一升级弹窗继续保留大道筑基功法选择。

### 本源感悟

练气后期突破到筑基前期时：

- 候选来自 `getMethodFoundationOriginInsights(method)`。

如后续保留金丹突破的本源感悟选择，也继续使用对应阶段 helper，避免用模糊前缀或全池切片。

### 攻击增益

攻击增益继续通过修为阶段解锁：

- 练气阶段：只显示 `attackBuffs[0]`。
- 筑基及以上：显示 `attackBuffs[0]` 与 `attackBuffs[1]`，或按当前 UI 只强调新解锁项。

引导车卡法门详情和预览不得再使用 `attackBuffs.slice(0, 2)` 的硬编码，应复用阶段 helper。在引导车卡尚未选择修为时，默认按练气前期展示，因此剑修只显示「剑势凛冽」。

## 展示设计

### 第二页卡面

第二页「感悟」栏只展示玩家真实选择：

- `upgradeCards.initialInsights`
- `upgradeCards.insights`

第二页「本源感悟」栏只展示：

- `upgradeCards.originInsights`

所有卡名使用 `formatCardDisplayName()`：

- 普通感悟去掉 `练气·` / `筑基·`。
- 本源感悟也去掉 `练气本源·` / `筑基本源·`。

未选择初始感悟时，不自动展示默认第一张感悟。

### 升级弹窗

升级弹窗数据仍然保留完整卡对象，但卡片标题显示时使用 `formatCardDisplayName()`。

顶部选中摘要也使用展示名。例如：

- `初始感悟：剑感初开`
- `练气感悟卡：步随剑走`

### 引导车卡

引导车卡法门详情需要显示当前拥有与未来可选的资源，按阶段分区：

- 入门攻击增益
- 练气感悟，4 张
- 练气本源感悟，2 张
- 筑基攻击增益
- 筑基感悟，4 张
- 筑基本源感悟，2 张

引导预览中，攻击增益按默认练气阶段只展示入门攻击增益。若未来引导车卡增加修为选择，再按选定修为调用同一 helper。

## 问卷车卡与引导车卡同步

问卷车卡和引导车卡最终都会创建主卡 snapshot。它们不应复制一套独立规则，而应复用主流程：

- 生成 snapshot 时只写入法门选择、道源选择等基础结果。
- 回到主界面后，由主界面的初始感悟检查逻辑发现当前法门缺少 `initialInsights`，并弹出 4 选 1。

这样可以保证主流程、问卷、引导三处都遵循同一套初始感悟规则，也避免在问卷/引导结果函数中重复维护感悟池。

如果希望问卷或引导确认前就展示法门资源预览，也只展示信息，不提前写入 `upgradeChoices`。

## 测试设计

### 法门规则测试

更新 `methodSelectionFlow.test.js` 或新增专门测试：

1. 剑修初始感悟池应为 4 张：
   - `练气·剑感初开`
   - `练气·气贯剑身`
   - `练气·步随剑走`
   - `练气·剑心通明`
2. 已选 `练气·剑感初开` 后，练气后期池应只剩 3 张。
3. 筑基感悟池应为 4 张。
4. 本源感悟显示名应去掉 `练气本源·` / `筑基本源·`。
5. `formatCardDisplayName()` 覆盖四类前缀。

### 数据完整性测试

遍历 `methodOptions`，断言每个法门：

- 练气普通感悟为 4 张。
- 筑基普通感悟为 4 张。
- 练气本源感悟为 2 张。
- 筑基本源感悟为 2 张。
- 攻击增益至少 2 条。

### 升级规则测试

更新 `realmUpgrade.test.js`：

1. 初始法门 prompt 对剑修展示 4 张练气感悟。
2. 练气后期升级在已选初始感悟后展示剩余 3 张。
3. 筑基后期升级展示筑基 4 张。
4. 切换法门后，旧法门相关 `upgradeChoices` 被清理。

### 展示测试

增加或更新轻量测试：

1. 第二页「感悟」名称显示去掉 `练气·` 和 `筑基·`。
2. 第二页「本源感悟」名称显示去掉 `练气本源·` 和 `筑基本源·`。
3. 引导车卡法门详情对剑修展示 1 条入门攻击增益和 4 张练气感悟。

## 实施范围

主要修改文件：

- `src/methodSelectionFlow.js`
- `src/methodProgression.js`
- `src/realmUpgrade.js`
- `src/upgradeChoiceState.js` 如需要额外清理能力
- `src/main.jsx`
- `src/data/methods.json` 仅在发现数据与资源 md 不一致时修正内容，不再依赖旧分组字段
- 对应测试文件

可能修改文件：

- `src/data/README.md`，更新 `methods.json` 字段说明。

## 风险与缓解

### 风险 1：旧字段与新 helper 同时存在导致误用

缓解：

- 测试明确断言规则 helper 来自 `insights` 和 `originInsights`。
- 逐步减少生产代码对 `qiInitialInsights` / `qiUpgradeInsights` 的读取。

### 风险 2：练气后期无法知道初始已选哪张

缓解：

- 练气后期 `createUpgradeStep()` 接收或能访问已聚合的 `upgradeCards.initialInsights`。
- 如果没有已选初始感悟，则显示全部 4 张，并在文案中提示先完成初始感悟选择。

推荐实现中应优先让主界面自动补弹初始感悟，减少这个 fallback 触发概率。

### 风险 3：卡名去前缀影响数据去重

缓解：

- 数据存储与去重仍使用原始 `card.name`。
- 只有 UI 展示使用 `formatCardDisplayName()`。

### 风险 4：引导车卡展示未来资源过多

缓解：

- 使用清晰分区展示，不把未来资源写入 snapshot。
- 默认预览攻击增益仍按练气阶段展示。

## 验收标准

1. 初次选择剑修时，初始感悟弹窗展示 4 张练气感悟。
2. 初始选择其中 1 张后，升到练气后期时只展示剩余 3 张。
3. 剑修练气阶段攻击增益只显示「剑势凛冽」。
4. 第二页「感悟」与「本源感悟」均只显示卡名本体，不显示 `练气`、`筑基`、`本源` 前缀。
5. 引导车卡法门详情展示剑修当前练气资源和未来可选资源，练气攻击增益只有「剑势凛冽」，练气感悟为 4 张。
6. 问卷车卡和引导车卡创建角色后，回到主界面会走同一套初始 4 选 1 感悟流程。
7. 所有自动化测试通过，生产构建通过。

## Spec 自审

- 无占位项。
- 本设计明确废弃旧的 2+2 练气感悟分组假设。
- 存储仍使用原始卡名，展示名去前缀不会破坏去重。
- 问卷/引导不复制选择逻辑，减少规则分叉。
- 范围限定在法门感悟、攻击增益、展示名与同步流程，不包含道源数据重构。
