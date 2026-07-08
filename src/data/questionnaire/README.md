# 问卷车卡数据

问卷配置在 `questions.json`。修改题目后重新构建和部署即可生效。

## 字段

- `id`：题目或选项的稳定标识。发布后尽量不要改，否则玩家本地草稿无法对应旧答案。
- `title`：玩家看到的问题。
- `type`：只能是 `single` 或 `multiple`。
- `required`：是否必答。省略时按必答处理。
- `mapsTo`：该题影响的角色卡属性。
- `targets`：选项给出的候选结果，一个选项可以写多个。

## mapsTo 可用值

- `realm`：境界，对应 `src/data/realms.json` 的 `name`。
- `origin`：出身，对应 `src/data/origins.json` 的 `name`。
- `source`：道源，对应 `src/data/sources.json` 的 `name`。
- `method`：法门，对应 `src/data/methods.json` 的 `name`。
- `dao`：大道，对应 `src/data/daos.json` 的 `name`。
- `fate`：逆命因果，对应 `src/data/fate.json` 中 `fateDraws` 的键。

## 统计规则

玩家提交后，系统按 `mapsTo` 分组统计所有选中选项的 `targets`。票数最高的结果会写入角色卡；如果票数相同，使用问卷中更早出现的结果。如果某个属性没有有效票数，会使用该属性的第一个默认值；`fate` 默认优先使用 `平平无奇`。

`targets` 必须和对应数据文件里的名称完全一致。写错的名称会被忽略。
