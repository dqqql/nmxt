# 资源库数据 / 文案管理

本文件夹集中存放**所有与游戏机制有关的文本**。以后更新文案，只需修改这里的 `.json`，
无需改动任何渲染代码——界面 (UI) 会自动按新内容渲染。

## 文件一览

| 文件 | 对应内容 | 说明 |
| --- | --- | --- |
| `realms.json` | 境界 | 资源库「境界」分类。`ability` 会自动填入卡面「境界能力」。 |
| `origins.json` | 出身 | 资源库「出身」分类。`effect` 会自动填入卡面「出身效果」。 |
| `sources.json` | 道源 | 资源库「道源」。含能力、效果、伤害阈值、神通(`skills`)、秘法(`arts`) 等。 |
| `methods.json` | 法门 | 资源库「法门」。含攻击增益(`attackBuffs`)、各境界感悟(`insights`)。 |
| `daos.json` | 大道 | 资源库「大道」。含大道效果、气修/筑基功法、引导问题等。 |
| `talents.json` | 天赋 / 天谴 | 按品阶（凡/人/地/天/仙）分组的天赋池 `talentPool`、天谴池 `punishmentPool`，以及品阶展示信息 `tierMeta`。 |
| `fate.json` | 因果 | 因果卡 `fateCards`、骰子标签/效果、因果进度 `fateProgression`、各因果卡对应的抽卡方案 `fateDraws`。 |
| `attributes.json` | 四属性 | 仙躯 / 身法 / 神魂 / 灵蕴 及其提示。 |
| `spellGroups.json` | 术法分组 | 第二页的神通 / 秘法 / 功法 / 灵宝 表格分组与行数。 |
| `resources.json` | 灵石资源 | 第一页底部灵石条的分档与数量。 |
| `buildGuide.json` | 建卡指引 | 右侧「建卡指引」弹窗的分步内容。 |
| `index.js` | 汇总入口 | 读取上述 JSON 并导出；同时保留抽卡随机逻辑。**一般不需要改动。** |

## 修改须知

- 这些是 **JSON** 文件，注意语法：键名和字符串都要用双引号 `"`，对象/数组最后一项后面**不要**留逗号。
- 文本里需要换行时写 `\n`（例如因果卡 `fateCards` 里的副标题）。
- 增删条目：直接在对应数组里加 / 删一个对象即可，UI 会自动多出 / 减少一项。
- `talents.json` 里天赋/天谴的品阶键固定为 `凡 / 人 / 地 / 天 / 仙`；`tierMeta` 的 `tone` 与 `style.css` 中的 `tier-*` 配色类对应，改 `tone` 前请确认样式存在。
- `fate.json` 的 `fateDraws` 用 `kind`(`talent`/`punishment`) + `tier`(品阶) + `count`(数量) 描述某张因果卡抽什么，改这里就能调整抽卡规则。
- 改完保存后刷新页面即可生效（开发模式下会热更新）。
