---
read_when:
    - Gerando ou revisando planos `openclaw secrets apply`
    - Depuração de erros `Invalid plan target path`
    - Entendendo o tipo de destino e o comportamento de validação de caminho
summary: 'Contrato para planos `secrets apply`: validação de destino, correspondência de caminho e escopo do destino `auth-profiles.json`'
title: Contrato do plano de aplicação de segredos
x-i18n:
    generated_at: "2026-06-27T17:33:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Esta página define o contrato estrito imposto por `openclaw secrets apply`.

Se um destino não corresponder a estas regras, o apply falha antes de alterar a configuração.

## Formato do arquivo de plano

`openclaw secrets apply --from <plan.json>` espera um array `targets` de destinos de plano:

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

## Upserts e exclusões de provedores

Os planos também podem incluir dois campos opcionais de nível superior que alteram o mapa
`secrets.providers` junto com as gravações por destino:

- `providerUpserts` — um objeto indexado por alias de provedor. Cada valor é uma
  definição de provedor (o mesmo formato aceito em
  `secrets.providers.<alias>` no `openclaw.json`, por exemplo, um provedor
  `exec` ou `file`).
- `providerDeletes` — um array de aliases de provedores a remover.

`providerUpserts` é executado antes de `targets`, portanto um `target.ref.provider` pode
referenciar um alias de provedor que o mesmo plano introduz em
`providerUpserts`. Sem isso, planos que referenciam um alias ainda não
configurado em `openclaw.json` falham com `provider "<alias>" is not
configured`.

```json5
{
  version: 1,
  protocolVersion: 1,
  providerUpserts: {
    onepassword_anthropic: {
      source: "exec",
      command: "/usr/bin/op",
      args: ["read", "op://Vault/Anthropic/credential"],
    },
  },
  providerDeletes: ["legacy_unused_alias"],
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.anthropic.apiKey",
      pathSegments: ["models", "providers", "anthropic", "apiKey"],
      providerId: "anthropic",
      ref: { source: "exec", provider: "onepassword_anthropic", id: "credential" },
    },
  ],
}
```

Provedores exec introduzidos por meio de `providerUpserts` ainda estão sujeitos às
regras de consentimento de exec em [Comportamento de consentimento do provedor exec](#exec-provider-consent-behavior):
planos que contêm provedores exec exigem `--allow-exec` no modo de gravação.

## Escopo de destino compatível

Destinos de plano são aceitos para caminhos de credenciais compatíveis em:

- [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)

## Comportamento do tipo de destino

Regra geral:

- `target.type` deve ser reconhecido e deve corresponder ao formato normalizado de `target.path`.

Aliases de compatibilidade continuam aceitos para planos existentes:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Regras de validação de caminho

Cada destino é validado com todos os itens a seguir:

- `type` deve ser um tipo de destino reconhecido.
- `path` deve ser um caminho com pontos não vazio.
- `pathSegments` pode ser omitido. Se fornecido, deve normalizar exatamente para o mesmo caminho que `path`.
- Segmentos proibidos são rejeitados: `__proto__`, `prototype`, `constructor`.
- O caminho normalizado deve corresponder ao formato de caminho registrado para o tipo de destino.
- Se `providerId` ou `accountId` estiver definido, ele deve corresponder ao id codificado no caminho.
- Destinos de `auth-profiles.json` exigem `agentId`.
- Ao criar um novo mapeamento de `auth-profiles.json`, inclua `authProfileProvider`.

## Comportamento de falha

Se um destino falhar na validação, o apply sai com um erro como:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Nenhuma gravação é confirmada para um plano inválido.

## Comportamento de consentimento do provedor exec

- `--dry-run` ignora verificações de SecretRef exec por padrão.
- Planos que contêm SecretRefs/provedores exec são rejeitados no modo de gravação, a menos que `--allow-exec` esteja definido.
- Ao validar/aplicar planos que contêm exec, passe `--allow-exec` tanto nos comandos de dry-run quanto nos de gravação.

## Observações sobre escopo de runtime e auditoria

- Entradas apenas de referência de `auth-profiles.json` (`keyRef`/`tokenRef`) são incluídas na resolução em runtime e na cobertura de auditoria.
- `secrets apply` grava destinos compatíveis de `openclaw.json`, destinos compatíveis de `auth-profiles.json` e destinos opcionais de limpeza.

## Verificações do operador

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Se apply falhar com uma mensagem de caminho de destino inválido, regenere o plano com `openclaw secrets configure` ou corrija o caminho de destino para um formato compatível acima.

## Documentação relacionada

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [CLI `secrets`](/pt-BR/cli/secrets)
- [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
