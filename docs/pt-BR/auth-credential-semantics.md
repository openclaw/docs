---
read_when:
    - Trabalhando na resolução de perfis de autenticação ou no roteamento de credenciais
    - Depuração de falhas de autenticação do modelo ou da ordem dos perfis
summary: Semântica canônica de elegibilidade e resolução de credenciais para perfis de autenticação
title: Semântica das credenciais de autenticação
x-i18n:
    generated_at: "2026-05-07T13:13:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d916ff95ca2ac1fe21e66f64b887b1df1e6b97d7dcc681e5bb9a9dee8ce9473
    source_path: auth-credential-semantics.md
    workflow: 16
---

Este documento define a elegibilidade canônica de credenciais e a semântica de resolução usadas em:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

O objetivo é manter alinhados o comportamento no momento da seleção e o comportamento em tempo de execução.

## Códigos de motivo estáveis da sondagem

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Credenciais de token

Credenciais de token (`type: "token"`) aceitam `token` inline e/ou `tokenRef`.

### Regras de elegibilidade

1. Um perfil de token é inelegível quando `token` e `tokenRef` estão ausentes.
2. `expires` é opcional.
3. Se `expires` estiver presente, ele deve ser um número finito maior que `0`.
4. Se `expires` for inválido (`NaN`, `0`, negativo, não finito ou do tipo errado), o perfil é inelegível com `invalid_expires`.
5. Se `expires` estiver no passado, o perfil é inelegível com `expired`.
6. `tokenRef` não contorna a validação de `expires`.

### Regras de resolução

1. A semântica do resolvedor corresponde à semântica de elegibilidade para `expires`.
2. Para perfis elegíveis, o material do token pode ser resolvido a partir do valor inline ou de `tokenRef`.
3. Referências que não podem ser resolvidas produzem `unresolved_ref` na saída de `models status --probe`.

## Portabilidade da cópia de agentes

A herança de autenticação do agente é por leitura direta. Quando um agente não tem perfil local, ele
pode resolver perfis do armazenamento do agente padrão/principal em tempo de execução sem
copiar material secreto para seu próprio `auth-profiles.json`.

Fluxos de cópia explícitos, como `openclaw agents add`, usam esta política de portabilidade:

- Perfis `api_key` são portáveis, a menos que `copyToAgents: false`.
- Perfis `token` são portáveis, a menos que `copyToAgents: false`.
- Perfis `oauth` não são portáveis por padrão porque tokens de atualização podem ser
  de uso único ou sensíveis a rotação.
- Fluxos OAuth pertencentes ao provedor podem optar por participar com `copyToAgents: true` somente quando
  a cópia de material de atualização entre agentes for reconhecidamente segura.

Perfis não portáveis continuam disponíveis por herança de leitura direta, a menos que
o agente de destino faça login separadamente e crie seu próprio perfil local.

## Rotas de autenticação somente por configuração

Entradas `auth.profiles` com `mode: "aws-sdk"` são metadados de roteamento, não credenciais
armazenadas. Elas são válidas quando o provedor de destino usa
`models.providers.<id>.auth: "aws-sdk"` ou a rota padrão integrada da AWS SDK do Amazon Bedrock.
Esses ids de perfil podem aparecer em `auth.order` e substituições de sessão
mesmo quando não existe uma entrada correspondente em `auth-profiles.json`.

Não grave `type: "aws-sdk"` em `auth-profiles.json`. Se uma instalação legada
tiver esse marcador, `openclaw doctor --fix` o move para `auth.profiles` e
remove o marcador do armazenamento de credenciais.

## Filtragem explícita da ordem de autenticação

- Quando `auth.order.<provider>` ou a substituição de ordem do armazenamento de autenticação é definida para um
  provedor, `models status --probe` só sonda ids de perfil que permanecem na
  ordem de autenticação resolvida para esse provedor.
- Um perfil armazenado para esse provedor que é omitido da ordem explícita
  não é tentado silenciosamente mais tarde. A saída da sondagem o relata com
  `reasonCode: excluded_by_auth_order` e o detalhe
  `Excluded by auth.order for this provider.`

## Resolução do destino da sondagem

- Destinos de sondagem podem vir de perfis de autenticação, credenciais de ambiente ou
  `models.json`.
- Se um provedor tem credenciais, mas o OpenClaw não consegue resolver um candidato de modelo
  sondável para ele, `models status --probe` relata `status: no_model` com
  `reasonCode: no_model`.

## Descoberta de credenciais de CLI externa

- Credenciais somente de tempo de execução pertencentes a CLIs externas são descobertas somente quando o
  provedor, runtime ou perfil de autenticação está no escopo da operação atual, ou
  quando um perfil local armazenado para essa fonte externa já existe.
- Chamadores do armazenamento de autenticação devem escolher um modo explícito de descoberta de CLI externa:
  `none` para autenticação persistida/de Plugin apenas, `existing` para atualizar perfis de CLI externa já
  armazenados, ou `scoped` para um conjunto concreto de provedor/perfil.
- Caminhos somente leitura/de status passam `allowKeychainPrompt: false`; eles usam credenciais de CLI externa
  respaldadas por arquivo apenas e não leem nem reutilizam resultados do macOS Keychain.

## Proteção da política OAuth SecretRef

- Entrada SecretRef é apenas para credenciais estáticas.
- Se uma credencial de perfil for `type: "oauth"`, objetos SecretRef não são aceitos para o material de credencial desse perfil.
- Se `auth.profiles.<id>.mode` for `"oauth"`, entrada `keyRef`/`tokenRef` respaldada por SecretRef para esse perfil é rejeitada.
- Violações são falhas graves em caminhos de resolução de autenticação de inicialização/recarregamento.

## Mensagens compatíveis com legado

Para compatibilidade de scripts, erros de sondagem mantêm esta primeira linha inalterada:

`Auth profile credentials are missing or expired.`

Detalhes mais amigáveis para humanos e códigos de motivo estáveis podem ser adicionados nas linhas subsequentes.

## Relacionado

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [Armazenamento de autenticação](/pt-BR/concepts/oauth)
