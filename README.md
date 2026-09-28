# CEH ポート暗記フラッシュカード

CEH（Certified Ethical Hacker）で問われる代表的なポート番号を覚えるための、スマホ向けフラッシュカードです。
ビルド不要・依存ゼロの静的サイトで、GitHub Pages で公開しています。

## 使い方

- カードをタップ（または Space）で裏返す
- 「○ わかった」「✕ わからなかった」で自己採点 → 次のカードへ
- 1周終わると「わからなかった」カードだけを再出題（要復習）
- 出題方向：用途→番号 / 番号→用途 / ランダム
- カテゴリ絞り込み、シャッフル、リセット
- キーボード：Space=めくる、→=次、←=前、↑=わかった、↓=わからなかった
- スワイプ：左=次、右=前
- 進捗・正答率はこの端末のブラウザ（localStorage）にだけ保存されます

## カードの追加方法

**`ports.js` の `PORTS` 配列に1行足すだけで増えます。** 例：

```js
  { id: 25, service: "MySQL", port: "3306", usage: "データベース", category: "infra", note: "PostgreSQLは5432" },
```

- `id` は他と重ならない番号にしてください
- `category` は `auth / smb / mail / web / infra / iot / ot / remote / file / mobile` のいずれか
- 裏面のメモを強調したい番号は、`ports.js` 末尾の `HIGHLIGHT_PORTS` に追加
- 追加後、`sw.js` の `VERSION`（例：`"v1"` → `"v2"`）を上げると、オフライン用キャッシュも更新されます

## ファイル構成

| ファイル | 役割 |
| --- | --- |
| `index.html` | 画面の骨組み |
| `style.css` | 見た目（ダークモード対応） |
| `app.js` | 動作（めくる・採点・保存など） |
| `ports.js` | カードデータ |
| `manifest.json` / `sw.js` / `icons/` | ホーム画面追加・オフライン対応（PWA） |
