---
read_when:
    - Gerando ou revisando planos `openclaw secrets apply`
    - Depurando erros de `Invalid plan target path`
    - Entendendo o comportamento de validação de tipo de alvo e caminho
summary: 'Contrato para planos `secrets apply`: validação de alvo, correspondência de caminho e escopo de alvo `auth-profiles.json`'
title: Contrato do plano de aplicação de segredos
x-i18n:
    generated_at: "2026-04-24T05:53:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80214353a1368b249784aa084c714e043c2d515706357d4ba1f111a3c68d1a84
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

Esta página define o contrato estrito aplicado por `openclaw secrets apply`.

Se um alvo não corresponder a estas regras, o apply falha antes de modificar a configuração.

## Formato do arquivo de plano

`openclaw secrets apply --from <plan.json>` espera um array `targets` de alvos do plano:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## Escopo de alvo compatível

Alvos do plano são aceitos para caminhos de credencial compatíveis em:

- [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)

## Comportamento do tipo de alvo

Regra geral:

- `target.type` deve ser reconhecido e deve corresponder ao formato normalizado de `target.path`.

Aliases de compatibilidade continuam aceitos para planos existentes:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Regras de validação de caminho

Cada alvo é validado com todos os itens a seguir:

- `type` deve ser um tipo de alvo reconhecido.
- `path` deve ser um caminho com pontos e não vazio.
- `pathSegments` pode ser omitido. Se fornecido, ele deve normalizar exatamente para o mesmo caminho que `path`.
- Segmentos proibidos são rejeitados: `__proto__`, `prototype`, `constructor`.
- O caminho normalizado deve corresponder ao formato de caminho registrado para o tipo de alvo.
- Se `providerId` ou `accountId` estiver definido, ele deve corresponder ao ID codificado no caminho.
- Alvos de `auth-profiles.json` exigem `agentId`.
- Ao criar um novo mapeamento em `auth-profiles.json`, inclua `authProfileProvider`.

## Comportamento em caso de falha

Se um alvo falhar na validação, o apply sai com um erro como:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Nenhuma gravação é confirmada para um plano inválido.

## Comportamento de consentimento do provider exec

- `--dry-run` ignora por padrão as verificações de SecretRef exec.
- Planos contendo SecretRefs/providers exec são rejeitados no modo de gravação, a menos que `--allow-exec` seja definido.
- Ao validar/aplicar planos com exec, passe `--allow-exec` tanto nos comandos dry-run quanto nos de gravação.

## Observações sobre escopo de runtime e auditoria

- Entradas `auth-profiles.json` somente com ref (`keyRef`/`tokenRef`) são incluídas na resolução em runtime e na cobertura de auditoria.
- `secrets apply` grava alvos compatíveis de `openclaw.json`, alvos compatíveis de `auth-profiles.json` e alvos opcionais de limpeza.

## Verificações do operador

```bash
# Validar o plano sem gravações
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Depois aplicar de verdade
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Para planos contendo exec, faça opt-in explícito em ambos os modos
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Se o apply falhar com uma mensagem de caminho de alvo inválido, gere novamente o plano com `openclaw secrets configure` ou corrija o caminho do alvo para um formato compatível acima.

## Documentação relacionada

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [CLI `secrets`](/pt-BR/cli/secrets)
- [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
