---
read_when:
    - Trabalhando na resolução de perfis de autenticação ou no roteamento de credenciais
    - Depuração de falhas de autenticação de modelo ou da ordem dos perfis
summary: Semântica canônica de elegibilidade e resolução de credenciais para perfis de autenticação
title: Semântica de credenciais de autenticação
x-i18n:
    generated_at: "2026-06-27T17:08:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 591c0384e1d43512252aaa7b362141b6bc93183b30b5847168758f86127f0663
    source_path: auth-credential-semantics.md
    workflow: 16
---

Este documento define a elegibilidade canônica de credenciais e a semântica de resolução usadas em:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

O objetivo é manter alinhados o comportamento no momento da seleção e o comportamento em runtime.

## Códigos de motivo estáveis de probe

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Credenciais de token

Credenciais de token (`type: "token"`) oferecem suporte a `token` inline e/ou `tokenRef`.

### Regras de elegibilidade

1. Um perfil de token é inelegível quando tanto `token` quanto `tokenRef` estão ausentes.
2. `expires` é opcional.
3. Se `expires` estiver presente, ele deve ser um número finito maior que `0`.
4. Se `expires` for inválido (`NaN`, `0`, negativo, não finito ou tipo incorreto), o perfil será inelegível com `invalid_expires`.
5. Se `expires` estiver no passado, o perfil será inelegível com `expired`.
6. `tokenRef` não ignora a validação de `expires`.

### Regras de resolução

1. A semântica do resolvedor corresponde à semântica de elegibilidade para `expires`.
2. Para perfis elegíveis, o material do token pode ser resolvido a partir de um valor inline ou de `tokenRef`.
3. Referências não resolvíveis produzem `unresolved_ref` na saída de `models status --probe`.

## Portabilidade de cópia do agente

A herança de autenticação do agente é read-through. Quando um agente não tem perfil local, ele
pode resolver perfis a partir do armazenamento padrão/principal do agente em runtime sem
copiar material secreto para seu próprio `auth-profiles.json`.

Fluxos de cópia explícitos, como `openclaw agents add`, usam esta política de portabilidade:

- Perfis `api_key` são portáveis, exceto quando `copyToAgents: false`.
- Perfis `token` são portáveis, exceto quando `copyToAgents: false`.
- Perfis `oauth` não são portáveis por padrão porque tokens de atualização podem ser
  de uso único ou sensíveis à rotação.
- Fluxos OAuth de propriedade do provedor podem optar por participar com `copyToAgents: true` somente quando
  copiar material de atualização entre agentes for sabidamente seguro.

Perfis não portáveis permanecem disponíveis por meio de herança read-through, exceto se
o agente de destino fizer login separadamente e criar seu próprio perfil local.

## Rotas de autenticação somente por configuração

Entradas `auth.profiles` com `mode: "aws-sdk"` são metadados de roteamento, não credenciais
armazenadas. Elas são válidas quando o provedor de destino usa
`models.providers.<id>.auth: "aws-sdk"` ou a rota AWS SDK de configuração do Amazon Bedrock de propriedade do Plugin.
Esses IDs de perfil podem aparecer em `auth.order` e substituições de sessão
mesmo quando não existe entrada correspondente em `auth-profiles.json`.

Não grave `type: "aws-sdk"` em `auth-profiles.json`. Se uma instalação legada
tiver esse marcador, `openclaw doctor --fix` o move para `auth.profiles` e
remove o marcador do armazenamento de credenciais.

## Filtragem explícita da ordem de autenticação

- Quando `auth.order.<provider>` ou a substituição de ordem do armazenamento de autenticação estiver definida para um
  provedor, `models status --probe` só executa probe em IDs de perfil que permanecem na
  ordem de autenticação resolvida para esse provedor.
- Um perfil armazenado para esse provedor que for omitido da ordem explícita
  não é tentado silenciosamente depois. A saída de probe o relata com
  `reasonCode: excluded_by_auth_order` e o detalhe
  `Excluded by auth.order for this provider.`

## Resolução do destino de probe

- Destinos de probe podem vir de perfis de autenticação, credenciais de ambiente ou
  `models.json`.
- Se um provedor tiver credenciais, mas o OpenClaw não conseguir resolver um candidato
  de modelo apto para probe para ele, `models status --probe` relata `status: no_model` com
  `reasonCode: no_model`.

## Descoberta de credenciais por CLI externa

- Credenciais somente de runtime pertencentes a CLIs externas são descobertas somente quando o
  provedor, o runtime ou o perfil de autenticação está no escopo da operação atual, ou
  quando um perfil local armazenado para essa fonte externa já existe.
- Chamadores do armazenamento de autenticação devem escolher um modo explícito de descoberta de CLI externa:
  `none` para autenticação persistida/de Plugin somente, `existing` para atualizar perfis de CLI externa
  já armazenados, ou `scoped` para um conjunto concreto de provedor/perfil.
- Caminhos somente leitura/de status passam `allowKeychainPrompt: false`; eles usam somente credenciais
  de CLI externa apoiadas em arquivo e não leem nem reutilizam resultados do macOS Keychain.

## Guarda de política de SecretRef OAuth

- Entrada SecretRef é apenas para credenciais estáticas.
- Se uma credencial de perfil for `type: "oauth"`, objetos SecretRef não são suportados para o material dessa credencial de perfil.
- Se `auth.profiles.<id>.mode` for `"oauth"`, a entrada `keyRef`/`tokenRef` apoiada por SecretRef para esse perfil será rejeitada.
- Violações são falhas rígidas nos caminhos de resolução de autenticação de inicialização/recarregamento.

## Mensagens compatíveis com legado

Para compatibilidade de script, erros de probe mantêm esta primeira linha inalterada:

`Auth profile credentials are missing or expired.`

Detalhes mais amigáveis para humanos e códigos de motivo estáveis podem ser adicionados nas linhas subsequentes.

## Relacionado

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [Armazenamento de autenticação](/pt-BR/concepts/oauth)
