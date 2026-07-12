---
read_when:
    - Gerando ou revisando planos de `openclaw secrets apply`
    - Depuração de erros `Invalid plan target path`
    - Entendendo o comportamento de validação do tipo e do caminho do destino
summary: 'Contrato para planos de `secrets apply`: validação de destinos, correspondência de caminhos e escopo de destino de `auth-profiles.json`'
title: Contrato do plano de aplicação de segredos
x-i18n:
    generated_at: "2026-07-12T15:15:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Esta página define o contrato rigoroso imposto por `openclaw secrets apply`. Se um destino não corresponder a essas regras, a aplicação falhará antes de modificar qualquer arquivo.

## Estrutura do arquivo de plano

`openclaw secrets apply --from <plan.json>` espera um array `targets` de destinos do plano:

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

`openclaw secrets configure` gera planos com essa estrutura. Você também pode escrever ou editar um manualmente.

## Inserções ou atualizações e exclusões de provedores

Os planos também podem incluir dois campos opcionais de nível superior que modificam o mapa `secrets.providers` junto com as gravações de cada destino:

- `providerUpserts` -- um objeto cujas chaves são aliases de provedores. Cada valor é uma definição de provedor (a mesma estrutura aceita em `secrets.providers.<alias>` no `openclaw.json`, por exemplo, um provedor `exec` ou `file`).
- `providerDeletes` -- um array de aliases de provedores a serem removidos.

`providerUpserts` é executado antes de `targets`, portanto, um `target.ref.provider` pode fazer referência a um alias de provedor que o mesmo plano introduz em `providerUpserts`. Sem essa ordenação, os planos que fazem referência a um alias ainda não configurado no `openclaw.json` falham com `provider "<alias>" is not configured`.

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

Os provedores exec introduzidos por meio de `providerUpserts` ainda estão sujeitos às regras de consentimento de exec descritas em [Comportamento de consentimento do provedor exec](#exec-provider-consent-behavior): planos que contêm provedores exec exigem `--allow-exec` no modo de gravação.

## Escopo de destinos compatíveis

Os destinos do plano são aceitos para caminhos de credenciais compatíveis em [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).

## Comportamento dos tipos de destino

`target.type` deve ser um tipo de destino reconhecido, e o `target.path` normalizado deve corresponder à estrutura de caminho registrada para esse tipo.

Alguns tipos de destino aceitam um alias de compatibilidade como `target.type` para planos existentes, além do nome canônico do tipo:

| Tipo canônico                         | Alias aceito                                    |
| ------------------------------------- | ----------------------------------------------- |
| `models.providers.apiKey`             | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`               | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount`  | `channels.googlechat.accounts.*.serviceAccount` |

## Regras de validação de caminhos

Cada destino é validado de acordo com todos os critérios a seguir:

- `type` deve ser um tipo de destino reconhecido.
- `path` deve ser um caminho de pontos não vazio.
- `pathSegments` pode ser omitido. Se fornecido, deve ser normalizado exatamente para o mesmo caminho que `path`.
- Segmentos proibidos são rejeitados: `__proto__`, `prototype`, `constructor`.
- O caminho normalizado deve corresponder à estrutura de caminho registrada para o tipo de destino.
- Se `providerId` ou `accountId` estiver definido, deverá corresponder ao ID codificado no caminho.
- Destinos de `auth-profiles.json` exigem `agentId`.
- Ao criar um novo mapeamento de `auth-profiles.json`, inclua `authProfileProvider`.

## Comportamento em caso de falha

Se a validação de um destino falhar, a aplicação será encerrada com um erro semelhante a:

```text
Caminho de destino inválido no plano para models.providers.apiKey: models.providers.openai.baseUrl
```

Nenhuma gravação será confirmada em um plano inválido: a resolução de destinos e a validação de caminhos são executadas antes de qualquer arquivo ser modificado. Separadamente, quando um plano válido começa a gravar, a aplicação primeiro cria snapshots de todos os arquivos modificados e os restaura se uma gravação posterior na mesma execução falhar; assim, uma gravação parcial nunca deixa os estados da configuração, dos perfis de autenticação ou das variáveis de ambiente fora de sincronia.

## Comportamento de consentimento do provedor exec

- `--dry-run` ignora por padrão as verificações de SecretRefs exec.
- Planos que contêm SecretRefs/provedores exec são rejeitados no modo de gravação, a menos que `--allow-exec` esteja definido.
- Ao validar/aplicar planos que contêm exec, passe `--allow-exec` nos comandos de simulação e de gravação.

## Observações sobre o escopo de execução e auditoria

- As entradas somente por referência de `auth-profiles.json` (`keyRef`/`tokenRef`) são incluídas na resolução de credenciais em tempo de execução e na cobertura da auditoria.
- `secrets apply` grava os destinos compatíveis de `openclaw.json`, os destinos compatíveis de `auth-profiles.json` e três etapas opcionais de limpeza, todas ativadas por padrão: `scrubEnv` (remove de `.env` os valores em texto simples que foram migrados), `scrubAuthProfilesForProviderTargets` (remove resíduos de texto simples/referências não utilizadas em `auth-profiles.json` para provedores que um plano acabou de migrar) e `scrubLegacyAuthJson` (remove entradas `api_key` migradas dos armazenamentos legados `auth.json`). Defina qualquer uma das opções `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets` ou `options.scrubLegacyAuthJson` como `false` no plano para ignorar essa etapa.

## Verificações do operador

```bash
# Validar o plano sem gravar
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Em seguida, aplicar de fato
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Para planos que contêm exec, aceitar explicitamente em ambos os modos
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Se a aplicação falhar com uma mensagem de caminho de destino inválido, gere novamente o plano com `openclaw secrets configure` ou corrija o caminho de destino para uma das estruturas compatíveis acima.

## Documentação relacionada

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [CLI `secrets`](/pt-BR/cli/secrets)
- [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
