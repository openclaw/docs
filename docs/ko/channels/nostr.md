---
read_when:
    - OpenClaw이 Nostr를 통해 DM을 수신하도록 설정하려는 경우
    - 탈중앙화 메시징을 설정하고 있습니다
summary: NIP-04 암호화 메시지를 통한 Nostr DM 채널
title: Nostr
x-i18n:
    generated_at: "2026-07-12T00:36:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr는 Nostr 릴레이를 통해 NIP-04로 암호화된 다이렉트 메시지를 OpenClaw가 수신하고 응답할 수 있게 해 주는 다운로드형 채널 Plugin(`@openclaw/nostr`)입니다. Gateway당 계정 하나만 사용할 수 있으며, DM만 지원합니다.

## 설치

```bash
openclaw plugins install @openclaw/nostr
```

현재 공식 릴리스 태그를 따르려면 버전 없는 패키지 명세를 사용하세요. 재현 가능한 설치가 필요한 경우에만 정확한 버전을 고정하세요.

로컬 체크아웃에서 설치하는 경우(개발 워크플로):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Plugin을 설치하거나 활성화한 후 Gateway를 다시 시작하세요. Plugin이 설치되면 온보딩(`openclaw onboard`)과 `openclaw channels add`에서 공유 채널 카탈로그를 통해 Nostr를 사용할 수 있습니다.

### 비대화형 설정

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

키를 구성에 저장하지 않고 환경의 `NOSTR_PRIVATE_KEY`에 유지하려면 `--use-env`를 사용하세요(기본 계정에만 해당).

## 빠른 설정

1. 필요한 경우 Nostr 키 쌍을 생성합니다.

```bash
# nak 사용
nak key generate
```

2. 구성에 추가합니다.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. 키를 내보냅니다.

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Gateway를 다시 시작합니다.

## 구성 참조

| 키           | 유형     | 기본값                                      | 설명                                                       |
| ------------ | -------- | ------------------------------------------- | ---------------------------------------------------------- |
| `privateKey` | 문자열   | 필수                                        | `nsec` 또는 16진수 형식의 비공개 키. 비밀 참조 사용 가능   |
| `relays`     | 문자열[] | `['wss://relay.damus.io', 'wss://nos.lol']` | 릴레이 URL(WebSocket)                                      |
| `dmPolicy`   | 문자열   | `pairing`                                   | DM 액세스 정책                                             |
| `allowFrom`  | 문자열[] | `[]`                                        | 허용된 발신자의 공개 키                                    |
| `enabled`    | 불리언   | `true`                                      | 채널 활성화/비활성화                                       |
| `name`       | 문자열   | -                                           | 표시 이름                                                  |
| `profile`    | 객체     | -                                           | NIP-01 프로필 메타데이터                                   |

## 프로필 메타데이터

프로필 데이터는 NIP-01 `kind:0` 이벤트로 게시됩니다. Control UI(Channels -> Nostr -> Profile)에서 관리하거나 구성에서 직접 설정할 수 있습니다.

예시:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "개인 비서 DM 봇",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

참고:

- 프로필 URL에는 `https://`를 사용해야 합니다.
- 릴레이에서 가져올 때는 필드를 병합하고 로컬 재정의 값을 유지합니다.

## 액세스 제어

### DM 정책

- **pairing**(기본값): 알 수 없는 발신자에게 페어링 코드를 보냅니다.
- **allowlist**: `allowFrom`에 있는 공개 키만 DM을 보낼 수 있습니다.
- **open**: 공개 인바운드 DM을 허용합니다(`allowFrom: ["*"]` 필요).
- **disabled**: 인바운드 DM을 무시합니다.

적용 관련 참고 사항:

- 발신자 정책 적용과 NIP-04 복호화 전에 인바운드 이벤트 서명을 검증하므로 위조된 이벤트를 조기에 거부합니다.
- 원본 DM 본문을 복호화하거나 처리하지 않고 페어링 응답을 보냅니다.
- 인바운드 DM에는 전체 및 발신자별 속도 제한이 적용되며, 크기가 지나치게 큰 페이로드는 복호화 전에 삭제됩니다.

### 허용 목록 예시

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## 키 형식

허용되는 형식:

- **비공개 키:** `nsec...` 또는 64자 16진수
- **공개 키(`allowFrom`):** `npub...` 또는 16진수

## 릴레이

기본값: `relay.damus.io` 및 `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

팁:

- 중복성을 확보하려면 릴레이 2~3개를 사용하세요.
- 릴레이를 너무 많이 사용하지 마세요(지연 시간 및 중복 발생).
- 유료 릴레이를 사용하면 안정성이 향상될 수 있습니다.
- 로컬 릴레이는 테스트에 사용해도 됩니다(`ws://localhost:7777`).

## 프로토콜 지원

| NIP    | 상태      | 설명                              |
| ------ | --------- | --------------------------------- |
| NIP-01 | 지원됨    | 기본 이벤트 형식 및 프로필 메타데이터 |
| NIP-04 | 지원됨    | 암호화된 DM(`kind:4`)             |
| NIP-17 | 계획됨    | 선물 포장형 DM                    |
| NIP-44 | 계획됨    | 버전이 지정된 암호화              |

## 테스트

### 로컬 릴레이

```bash
# strfry 시작
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### 수동 테스트

1. Gateway 로그 또는 `openclaw channels status`에서 봇 공개 키를 확인합니다(16진수이며, 필요한 경우 클라이언트에서 npub로 변환).
2. Nostr 클라이언트(Amethyst, Damus 등)를 엽니다.
3. 봇 공개 키로 DM을 보냅니다.
4. 응답을 확인합니다.

## 문제 해결

### 메시지가 수신되지 않음

- 비공개 키가 유효한지 확인하세요.
- 릴레이 URL에 접근할 수 있고 `wss://`를 사용하는지 확인하세요(로컬의 경우 `ws://`).
- `enabled`가 `false`가 아닌지 확인하세요.
- Gateway 로그에서 릴레이 연결 오류를 확인하세요.

### 응답이 전송되지 않음

- 릴레이가 쓰기를 허용하는지 확인하세요.
- 아웃바운드 연결을 확인하세요.
- 릴레이 속도 제한이 적용되는지 확인하세요.

### 응답이 중복됨

- 여러 릴레이를 사용할 때 발생할 수 있는 정상적인 동작입니다.
- 메시지는 이벤트 ID를 기준으로 중복 제거되며, 첫 번째 전달만 응답을 트리거합니다.

## 보안

- 비공개 키를 절대로 커밋하지 마세요.
- 키에는 환경 변수를 사용하세요.
- 프로덕션 봇에는 `allowlist` 사용을 고려하세요.
- 발신자 정책 전에 서명을 검증하고 복호화 전에 발신자 정책을 적용하므로 위조된 이벤트를 조기에 거부하며, 알 수 없는 발신자가 전체 암호화 연산을 강제로 수행하게 할 수 없습니다.

## 제한 사항(MVP)

- 다이렉트 메시지만 지원합니다(그룹 채팅 미지원).
- 미디어 첨부 파일을 지원하지 않습니다.
- NIP-04만 지원합니다(NIP-17 선물 포장 방식은 지원 예정).

## 관련 문서

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 제한
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 액세스 모델 및 보안 강화
