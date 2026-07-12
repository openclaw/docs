---
read_when:
    - ワークスペースを手動で初期構築する
summary: TOOLS.md 用ワークスペーステンプレート
title: TOOLS.md テンプレート
x-i18n:
    generated_at: "2026-07-11T22:40:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - ローカルメモ

Skills はツールが_どのように_動作するかを定義します。このファイルには、カメラの名前と場所、SSH ホストとエイリアス、好みの TTS 音声、スピーカーや部屋の名前、デバイスの愛称など、セットアップ固有の情報を記載します。

## 例

```markdown
### カメラ

- living-room → メインエリア、180° 広角
- front-door → 玄関、動体検知で作動

### SSH

- home-server → 192.168.1.100、ユーザー: admin

### TTS

- 好みの音声: "Nova"（温かみがあり、ややイギリス英語風）
- デフォルトのスピーカー: Kitchen HomePod
```

## 分ける理由

Skills は共有されます。セットアップはあなた固有のものです。両者を分けておけば、メモを失わずに Skills を更新でき、インフラストラクチャを漏らさずに Skills を共有できます。

---

作業に役立つ情報を自由に追加してください。これはあなたの早見表です。

## 関連項目

- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
