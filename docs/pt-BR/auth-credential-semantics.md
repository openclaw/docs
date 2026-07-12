---
read_when:
    - Trabalhando na resolução de perfis de autenticação ou no roteamento de credenciais
    - Depuração de falhas de autenticação do modelo ou da ordem dos perfis
summary: Semântica canônica de elegibilidade e resolução de credenciais para perfis de autenticação
title: Semântica das credenciais de autenticação
x-i18n:
    generated_at: "2026-07-12T14:51:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

Essas semânticas mantêm alinhado o comportamento de autenticação no momento da seleção e durante a execução. Elas são compartilhadas por:

- `resolveAuthProfileOrder` (ordenação de perfis)
- `resolveApiKeyForProfile` (resolução de credenciais em tempo de execução)
- `openclaw models status --probe`
- verificações de autenticação do `openclaw doctor` (`doctor-auth`)

## Códigos de motivo estáveis da sondagem

Os resultados da sondagem incluem uma categoria de `status` (`ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`) e um `reasonCode` estável quando a sondagem não chegou a realizar uma chamada de modelo:

| `reasonCode`             | Significado                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `excluded_by_auth_order` | Perfil omitido da ordem explícita de autenticação do respectivo provedor.                     |
| `missing_credential`     | Nenhuma credencial embutida nem SecretRef está configurada.                                   |
| `expired`                | O `expires` do token está no passado.                                                         |
| `invalid_expires`        | `expires` não é um carimbo de data/hora Unix válido, positivo e em ms.                        |
| `unresolved_ref`         | Não foi possível resolver a SecretRef configurada.                                            |
| `ineligible_profile`     | O perfil é incompatível com a configuração do provedor (inclui entrada de chave malformada).  |
| `no_model`               | Existem credenciais, mas nenhum modelo candidato sondável foi resolvido.                      |

As verificações de elegibilidade informam `ok` como código de motivo para credenciais utilizáveis.

## Credenciais de token

As credenciais de token (`type: "token"`) são compatíveis com `token` embutido e/ou `tokenRef`.

### Regras de elegibilidade

1. Um perfil de token é inelegível quando tanto `token` quanto `tokenRef` estão ausentes (`missing_credential`).
2. `expires` é opcional. Quando presente, deve ser um número finito de milissegundos desde a época Unix, maior que `0` e não superior ao carimbo de data/hora máximo de `Date` do JavaScript (8640000000000000).
3. Se `expires` for inválido (tipo incorreto, `NaN`, `0`, negativo, não finito ou acima desse máximo), o perfil será inelegível com `invalid_expires`.
4. Se `expires` estiver no passado, o perfil será inelegível com `expired`.
5. `tokenRef` não ignora a validação de `expires`.

### Regras de resolução

1. As semânticas do resolvedor correspondem às semânticas de elegibilidade para `expires`.
2. Para perfis elegíveis, o conteúdo do token pode ser resolvido a partir do valor embutido ou de `tokenRef`.
3. Referências que não podem ser resolvidas produzem `unresolved_ref` na saída de `models status --probe`.

## Portabilidade de cópia de agentes

A herança de autenticação de agentes usa leitura indireta. Quando um agente não tem um perfil local, ele resolve os perfis do armazenamento do agente padrão/principal em tempo de execução, sem copiar o conteúdo secreto para seu próprio armazenamento de credenciais (`agents/<agentId>/agent/openclaw-agent.sqlite`).

Fluxos de cópia explícita, como `openclaw agents add`, usam esta política de portabilidade:

- Os perfis `api_key` e `token` são portáveis, a menos que `copyToAgents: false`.
- Os perfis `oauth` não são portáveis por padrão, pois tokens de atualização podem ser de uso único ou sensíveis à rotação.
- Fluxos OAuth pertencentes ao provedor podem optar pela portabilidade com `copyToAgents: true` somente quando for comprovadamente seguro copiar o conteúdo de atualização entre agentes; essa opção só se aplica quando o perfil contém dados embutidos de acesso/atualização.

Os perfis não portáveis continuam disponíveis por meio da herança com leitura indireta, a menos que o agente de destino faça login separadamente e crie seu próprio perfil local.

## Rotas de autenticação somente por configuração

As entradas de `auth.profiles` com `mode: "aws-sdk"` são metadados de roteamento, não credenciais armazenadas. Elas são válidas quando o provedor de destino usa `models.providers.<id>.auth: "aws-sdk"`, a rota gravada pela configuração do Amazon Bedrock pertencente ao plugin. Esses ids de perfil podem aparecer em `auth.order` e em substituições de sessão mesmo quando não existe uma entrada correspondente no armazenamento de credenciais.

Não grave `type: "aws-sdk"` no armazenamento de credenciais; as credenciais armazenadas são apenas `api_key`, `token` ou `oauth`. Se um `auth-profiles.json` legado tiver esse marcador, `openclaw doctor --fix` o moverá para `auth.profiles` e removerá o marcador do armazenamento.

## Filtragem explícita da ordem de autenticação

- Quando `auth.order.<provider>` ou a substituição da ordem no armazenamento de autenticação estiver definida para um provedor, `models status --probe` sondará somente os ids de perfil que permanecerem na ordem de autenticação resolvida desse provedor. A substituição armazenada prevalece sobre a configuração `auth.order`.
- Um perfil armazenado desse provedor que seja omitido da ordem explícita não será tentado silenciosamente mais tarde. A saída da sondagem o relata com `reasonCode: excluded_by_auth_order` e o detalhe `Excluded by auth.order for this provider.`

## Resolução do destino da sondagem

- Os destinos de sondagem podem vir de perfis de autenticação, credenciais de ambiente ou de `models.json` (`source` do resultado: `profile`, `env`, `models.json`).
- Se um provedor tiver credenciais, mas o OpenClaw não conseguir resolver para ele um modelo candidato que possa ser sondado, `models status --probe` relatará `status: no_model` com `reasonCode: no_model`.

## Descoberta de credenciais de CLI externa

- As credenciais exclusivas de runtime pertencentes a CLIs externas (Claude CLI para `claude-cli`, Codex CLI para `openai`, MiniMax CLI para `minimax-portal`) são descobertas somente quando o provedor, o runtime ou o perfil de autenticação está no escopo da operação atual, ou quando já existe um perfil local armazenado para essa fonte externa.
- Os chamadores do armazenamento de autenticação escolhem um modo explícito de descoberta de CLI externa: `none` somente para autenticação persistida/do plugin, `existing` para atualizar perfis de CLI externa já armazenados ou `scoped` para um conjunto concreto de provedores/perfis.
- Os caminhos somente leitura/de status passam `allowKeychainPrompt: false`; eles usam somente credenciais de CLI externa baseadas em arquivo e não leem nem reutilizam resultados do macOS Keychain.

## Proteção da política de SecretRef para OAuth

A entrada SecretRef destina-se somente a credenciais estáticas. As credenciais OAuth são mutáveis durante o runtime (os fluxos de atualização persistem tokens rotacionados), portanto, o material OAuth baseado em SecretRef dividiria o estado mutável entre armazenamentos.

- Se a credencial de um perfil for `type: "oauth"`, objetos SecretRef serão rejeitados em qualquer campo de material de credencial desse perfil.
- Se `auth.profiles.<id>.mode` for `"oauth"`, a entrada `keyRef`/`tokenRef` baseada em SecretRef para esse perfil será rejeitada.
- As violações são falhas definitivas (erros lançados) nos caminhos de preparação de segredos durante a inicialização/recarga e de resolução de perfis.

## Mensagens compatíveis com versões legadas

Para manter a compatibilidade com scripts, os erros de sondagem mantêm esta primeira linha inalterada:

`Auth profile credentials are missing or expired.`

O detalhe de fácil compreensão e o código de motivo estável aparecem nas linhas seguintes no formato `↳ Auth reason [code]: ...`.

## Relacionado

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [Armazenamento de autenticação](/pt-BR/concepts/oauth)
