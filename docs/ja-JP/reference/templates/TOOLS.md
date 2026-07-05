---
read_when:
    - ワークスペースを手動でブートストラップする
summary: TOOLS.md 用のワークスペーステンプレート
title: TOOLS.md テンプレート
x-i18n:
    generated_at: "2026-07-05T11:46:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - ローカルメモ

Skills はツールが_どのように_動作するかを定義します。このファイルは_あなた_固有の詳細のためのものです。つまり、あなたのセットアップに固有の内容です: カメラ名と場所、SSH ホストとエイリアス、好みの TTS 音声、スピーカー/部屋の名前、デバイスのニックネーム、環境固有のあらゆるもの。

## 例

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## なぜ分けるのか？

Skills は共有されます。あなたのセットアップはあなたのものです。分けておくことで、メモを失わずに Skills を更新でき、インフラストラクチャを漏らさずに Skills を共有できます。

---

作業に役立つものは何でも追加してください。これはあなたのチートシートです。

## 関連

- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
