---
read_when:
    - 텔레메트리 / 개인정보 보호 제어 작업 중
    - 수집되는 데이터에 관한 질문
summary: ClawHub CLI가 수집하는 설치 텔레메트리와 옵트아웃 방법.
x-i18n:
    generated_at: "2026-07-02T22:25:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# 텔레메트리

ClawHub는 집계 설치 수를 계산하기 위해 최소한의 CLI 텔레메트리를 사용합니다.

## 텔레메트리가 수집되는 경우

텔레메트리는 다음 경우에만 전송됩니다.

- CLI에 로그인되어 있습니다.
- `clawhub install <slug>`를 실행합니다.
- 텔레메트리가 **비활성화되어 있지 않습니다**(아래 “비활성화 방법” 참조).

로그인되어 있지 않으면 아무것도 보고되지 않습니다.

## 수집하는 항목

보고되는 각 `clawhub install`에서 CLI는 최선 노력 방식의 설치 이벤트 하나를 전송합니다.

이 이벤트에는 다음이 포함됩니다.

- `slug`: 설치된 Skills 슬러그.
- `version`: 알려진 경우 설치된 버전.

### 수집하지 _않는_ 항목

- 폴더 경로나 폴더에서 파생된 식별자는 수집하지 않습니다.
- 파일 내용은 수집하지 않습니다.
- 실행별 로그, 프롬프트 또는 기타 CLI 출력은 수집하지 않습니다.

## 설치 수

ClawHub는 Skills별 집계 카운터를 유지합니다.

- `installsAllTime`: 해당 Skills에 대해 CLI 설치를 하나 이상 보고한 고유 사용자.
- `installsCurrent`: 설치를 보고했으며 자신의 텔레메트리를 삭제하지 않은 고유 사용자.

## 투명성 + 사용자 제어

모든 사람은 **집계된 설치 카운터**만 볼 수 있습니다.

계정을 삭제하면 텔레메트리 데이터도 삭제됩니다.

## 텔레메트리 비활성화 방법

환경 변수를 설정하세요.

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

이 설정이 있으면 CLI는 설치 텔레메트리를 전송하지 않습니다.
