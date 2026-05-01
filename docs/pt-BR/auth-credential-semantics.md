---
read_when:
    - Trabalhando na resolução de perfis de autenticação ou no roteamento de credenciais
    - Depuração de falhas de autenticação de modelos ou da ordem de perfis
summary: Semântica canônica de elegibilidade e resolução de credenciais para perfis de autenticação
title: Semântica das credenciais de autenticação
x-i18n:
    generated_at: "2026-05-01T05:55:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39b9f96159d5a7b793983d07c37a73139a0904abbbc8831267807d6acf5c0037
    source_path: auth-credential-semantics.md
    workflow: 16
---

Este documento define a elegibilidade canônica de credenciais e a semântica de resolução usadas em:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

O objetivo é manter alinhados o comportamento no momento da seleção e em tempo de execução.

## Códigos de motivo estáveis de sondagem

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
4. Se `expires` for inválido (`NaN`, `0`, negativo, não finito ou do tipo errado), o perfil será inelegível com `invalid_expires`.
5. Se `expires` estiver no passado, o perfil será inelegível com `expired`.
6. `tokenRef` não ignora a validação de `expires`.

### Regras de resolução

1. A semântica do resolvedor corresponde à semântica de elegibilidade para `expires`.
2. Para perfis elegíveis, o material do token pode ser resolvido a partir do valor inline ou de `tokenRef`.
3. Referências não resolvíveis produzem `unresolved_ref` na saída de `models status --probe`.

## Portabilidade de cópia de agente

A herança de autenticação de agente é feita por leitura indireta. Quando um agente não tem perfil local, ele pode resolver perfis a partir do armazenamento do agente padrão/principal em tempo de execução sem copiar material secreto para seu próprio `auth-profiles.json`.

Fluxos de cópia explícitos, como `openclaw agents add`, usam esta política de portabilidade:

- Perfis `api_key` são portáteis, a menos que `copyToAgents: false`.
- Perfis `token` são portáteis, a menos que `copyToAgents: false`.
- Perfis `oauth` não são portáteis por padrão porque tokens de atualização podem ser de uso único ou sensíveis à rotação.
- Fluxos OAuth pertencentes ao provedor podem optar por participar com `copyToAgents: true` somente quando a cópia de material de atualização entre agentes for sabidamente segura.

Perfis não portáteis continuam disponíveis por herança de leitura indireta, a menos que o agente de destino faça login separadamente e crie seu próprio perfil local.

## Filtragem explícita da ordem de autenticação

- Quando `auth.order.<provider>` ou a substituição de ordem do armazenamento de autenticação está definida para um provedor, `models status --probe` sonda apenas IDs de perfil que permanecem na ordem de autenticação resolvida para esse provedor.
- Um perfil armazenado para esse provedor que é omitido da ordem explícita não é tentado silenciosamente depois. A saída da sondagem o relata com `reasonCode: excluded_by_auth_order` e o detalhe `Excluded by auth.order for this provider.`

## Resolução do alvo da sondagem

- Alvos de sondagem podem vir de perfis de autenticação, credenciais de ambiente ou `models.json`.
- Se um provedor tiver credenciais, mas o OpenClaw não conseguir resolver um candidato de modelo sondável para ele, `models status --probe` relata `status: no_model` com `reasonCode: no_model`.

## Descoberta de credenciais por CLI externa

- Credenciais apenas de tempo de execução pertencentes a CLIs externas são descobertas somente quando o provedor, o runtime ou o perfil de autenticação está no escopo da operação atual, ou quando um perfil local armazenado para essa origem externa já existe.
- Chamadores do armazenamento de autenticação devem escolher um modo explícito de descoberta de CLI externa: `none` para autenticação persistida/de Plugin apenas, `existing` para atualizar perfis de CLI externa já armazenados ou `scoped` para um conjunto concreto de provedor/perfil.
- Caminhos somente leitura/de status passam `allowKeychainPrompt: false`; eles usam apenas credenciais de CLI externa baseadas em arquivo e não leem nem reutilizam resultados do Keychain do macOS.

## Guarda de política de SecretRef para OAuth

- Entrada SecretRef é apenas para credenciais estáticas.
- Se a credencial de um perfil for `type: "oauth"`, objetos SecretRef não serão compatíveis com o material de credencial desse perfil.
- Se `auth.profiles.<id>.mode` for `"oauth"`, entradas `keyRef`/`tokenRef` baseadas em SecretRef para esse perfil serão rejeitadas.
- Violações são falhas rígidas nos caminhos de resolução de autenticação de inicialização/recarregamento.

## Mensagens compatíveis com legado

Para compatibilidade com scripts, erros de sondagem mantêm esta primeira linha inalterada:

`Auth profile credentials are missing or expired.`

Detalhes mais amigáveis para humanos e códigos de motivo estáveis podem ser adicionados nas linhas subsequentes.

## Relacionado

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [Armazenamento de autenticação](/pt-BR/concepts/oauth)
