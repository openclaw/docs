---
permalink: /security/formal-verification/
read_when:
    - Revisando garantias ou limites de modelos formais de segurança
    - Reproduzindo ou atualizando verificações de modelos de segurança TLA+/TLC
summary: Modelos de segurança verificados por máquina para os caminhos de maior risco do OpenClaw.
title: Verificação formal (modelos de segurança)
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T06:12:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f50fa9118a80054b8d556cd4f1901b2d5fcb37fb0866bd5357a1b0a46c74116
    source_path: security/formal-verification.md
    workflow: 15
---

Esta página acompanha os **modelos formais de segurança** do OpenClaw (TLA+/TLC hoje; outros quando necessário).

> Observação: alguns links mais antigos podem se referir ao nome anterior do projeto.

**Objetivo (estrela guia):** fornecer um argumento verificado por máquina de que o OpenClaw aplica sua
política de segurança pretendida (autorização, isolamento de sessão, controle de ferramentas e
segurança contra má configuração), sob premissas explícitas.

**O que isso é (hoje):** uma **suíte executável de regressão de segurança** orientada por atacante:

- Cada afirmação tem uma verificação de modelo executável sobre um espaço de estados finito.
- Muitas afirmações têm um **modelo negativo** correspondente que produz um traço de contraexemplo para uma classe realista de bug.

**O que isso ainda não é:** uma prova de que “o OpenClaw é seguro em todos os aspectos” ou de que a implementação completa em TypeScript está correta.

## Onde os modelos ficam

Os modelos são mantidos em um repositório separado: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Ressalvas importantes

- Estes são **modelos**, não a implementação completa em TypeScript. Pode haver divergência entre modelo e código.
- Os resultados são limitados pelo espaço de estados explorado pelo TLC; um resultado “verde” não implica segurança além das premissas e limites modelados.
- Algumas afirmações dependem de premissas ambientais explícitas (por exemplo, implantação correta, entradas de configuração corretas).

## Reproduzindo os resultados

Hoje, os resultados são reproduzidos clonando localmente o repositório de modelos e executando o TLC (veja abaixo). Uma iteração futura poderá oferecer:

- modelos executados em CI com artefatos públicos (traços de contraexemplo, logs de execução)
- um workflow hospedado de “executar este modelo” para verificações pequenas e limitadas

Primeiros passos:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Exposição do Gateway e má configuração de gateway aberto

**Afirmação:** fazer bind além de loopback sem autenticação pode tornar possível comprometimento remoto / aumentar a exposição; token/senha bloqueia atacantes não autenticados (segundo as premissas do modelo).

- Execuções verdes:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Vermelho (esperado):
  - `make gateway-exposure-v2-negative`

Consulte também: `docs/gateway-exposure-matrix.md` no repositório de modelos.

### Pipeline de exec de Node (capacidade de maior risco)

**Afirmação:** `exec host=node` exige (a) allowlist de comando de Node mais comandos declarados e (b) aprovação ao vivo quando configurada; aprovações usam tokens para evitar replay (no modelo).

- Execuções verdes:
  - `make nodes-pipeline`
  - `make approvals-token`
- Vermelho (esperado):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Armazenamento de pairing (controle de DM)

**Afirmação:** solicitações de pairing respeitam TTL e limites de solicitações pendentes.

- Execuções verdes:
  - `make pairing`
  - `make pairing-cap`
- Vermelho (esperado):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Controle de entrada (menções + bypass de comando de controle)

**Afirmação:** em contextos de grupo que exigem menção, um “comando de controle” não autorizado não pode contornar a restrição por menção.

- Verde:
  - `make ingress-gating`
- Vermelho (esperado):
  - `make ingress-gating-negative`

### Roteamento/isolamento por chave de sessão

**Afirmação:** DMs de pares distintos não colapsam na mesma sessão, a menos que estejam explicitamente vinculadas/configuradas.

- Verde:
  - `make routing-isolation`
- Vermelho (esperado):
  - `make routing-isolation-negative`

## v1++: modelos adicionais limitados (concorrência, tentativas, correção de traço)

Estes são modelos de continuação que aumentam a fidelidade em torno de modos de falha do mundo real (atualizações não atômicas, novas tentativas e fan-out de mensagens).

### Concorrência / idempotência do armazenamento de pairing

**Afirmação:** um armazenamento de pairing deve impor `MaxPending` e idempotência mesmo sob interleavings (ou seja, “check-then-write” deve ser atômico / com lock; refresh não deve criar duplicatas).

O que isso significa:

- Sob solicitações concorrentes, você não pode exceder `MaxPending` para um canal.
- Solicitações/refreshes repetidos para o mesmo `(channel, sender)` não devem criar linhas pendentes vivas duplicadas.

- Execuções verdes:
  - `make pairing-race` (verificação de limite atômica/com lock)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Vermelho (esperado):
  - `make pairing-race-negative` (corrida de limite begin/commit não atômica)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Correlação de traço / idempotência de entrada

**Afirmação:** a ingestão deve preservar a correlação de traço ao longo do fan-out e ser idempotente sob novas tentativas do provedor.

O que isso significa:

- Quando um evento externo se torna várias mensagens internas, cada parte mantém a mesma identidade de traço/evento.
- Novas tentativas não resultam em processamento duplicado.
- Se IDs de evento do provedor estiverem ausentes, a desduplicação usa fallback para uma chave segura (por exemplo, ID de traço) para evitar descartar eventos distintos.

- Verde:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Vermelho (esperado):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Precedência de dmScope no roteamento + identityLinks

**Afirmação:** o roteamento deve manter sessões de DM isoladas por padrão e só colapsar sessões quando explicitamente configurado (precedência por canal + identity links).

O que isso significa:

- Substituições específicas de canal para dmScope devem prevalecer sobre padrões globais.
- identityLinks devem colapsar apenas dentro de grupos explicitamente vinculados, não entre pares não relacionados.

- Verde:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Vermelho (esperado):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Relacionado

- [Threat model](/pt-BR/security/THREAT-MODEL-ATLAS)
- [Contributing to the threat model](/pt-BR/security/CONTRIBUTING-THREAT-MODEL)
