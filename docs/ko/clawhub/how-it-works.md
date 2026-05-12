---
read_when:
    - 목록, 버전, 설치, 게시 및 검토 이해하기
summary: ClawHub 목록, 버전, 설치, 게시, 검사 및 업데이트가 작동하는 방식.
x-i18n:
    generated_at: "2026-05-12T23:28:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 작동 방식

ClawHub는 OpenClaw Skills 및 plugins를 위한 registry 계층입니다. 사용자가
packages를 발견할 수 있는 장소, publishers가 versions를 릴리스할 수 있는 장소를 제공하며,
OpenClaw가 해당 packages를 안전하게 설치하고 업데이트할 수 있도록 충분한 metadata를 제공합니다.

## Registry records

각 public listing은 다음을 포함하는 registry record입니다.

- owner와 slug 또는 package name
- 하나 이상의 published versions
- metadata, summary, files, source attribution
- `latest`와 같은 changelog 및 tag 정보
- download, install, star, comment signals
- security scan 및 moderation status

listing page는 사용자가 skill 또는
plugin을 설치하기 전에 그것이 수행한다고 주장하는 내용을 검토할 수 있는 표준 위치입니다.

## Skills

skill은 `SKILL.md`를 중심으로 하는 versioned text bundle입니다. supporting files,
examples, templates, scripts를 포함할 수 있습니다.

ClawHub는 `SKILL.md` frontmatter를 읽어 skill name,
description, requirements, environment variables, metadata를 이해합니다. 정확한
metadata는 사용자가 skill 설치 여부를 결정하는 데 도움이 되고,
자동화된 scans가 선언된 동작과 관찰된 동작 간의 불일치를 감지하는 데 도움이 되므로 중요합니다.

[Skill format](/ko/clawhub/skill-format)을 참조하세요.

## Plugins

Plugins는 패키징된 OpenClaw extensions입니다. ClawHub는 package metadata,
compatibility information, source links, artifacts, version records를 저장합니다.

OpenClaw가 ClawHub에서 plugin을 설치할 때, 설치 전에 공지된 compatibility
metadata를 확인합니다. Package records에는 API compatibility,
minimum gateway version, host targets, environment requirements, artifact
digests가 포함될 수 있습니다.

registry를 source of truth로 사용하려면 명시적인 ClawHub install source를 사용하세요.

```bash
openclaw plugins install clawhub:<package>
```

## Publishing

Publishing은 새로운 immutable version record를 생성합니다. Publishers는 인증된 registry workflows에 `clawhub`
CLI를 사용합니다.

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

업로드 전에 resolved payload를 미리 보려면 dry runs를 사용하세요. 그런 다음 public pages에는
published metadata, files, source attribution, scan status가 표시됩니다.

## 설치 및 업데이트

OpenClaw install commands는 ClawHub를 package source로 사용합니다.

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw는 install source metadata를 기록하여 이후 updates가 동일한
registry package를 확인할 수 있도록 합니다. ClawHub CLI는 전체 OpenClaw workspace 밖에서 registry-managed skill folders를 원하는 사용자를 위해 직접 skill install 및
update workflows도 지원합니다.

## Security state

ClawHub는 publishing에 열려 있지만, releases는 여전히 upload gates,
automated checks, user reports, moderator action의 적용을 받습니다.

Public pages는 사용 가능한 경우 scan summaries를 표시합니다. 보류, 숨김,
또는 차단된 content는 diagnostics를 위해 owner에게는 계속 표시되면서
public search 및 install flows에서는 사라질 수 있습니다.

[Security + moderation](/ko/clawhub/security) 및
[Acceptable usage](/ko/clawhub/acceptable-usage)를 참조하세요.

## API access

ClawHub는 discovery, search, package details, downloads를 위한 public read APIs를 제공합니다.
Third-party catalogs는 canonical ClawHub listing으로 다시 연결하고,
rate limits를 준수하며, endorsement를 암시하지 않는 경우 이러한 APIs를 사용할 수 있습니다.

[Public API](/ko/clawhub/api) 및 [HTTP API](/ko/clawhub/http-api)를 참조하세요.
