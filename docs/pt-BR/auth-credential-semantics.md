---
read_when:
    - Trabalhando na resolução de perfil de autenticação ou no roteamento de credenciais
    - Depuração de falhas de autenticação de modelo ou da ordem dos perfis
summary: Semântica de elegibilidade e resolução de credenciais canônicas para perfis de autenticação
title: Semântica das credenciais de autenticação
x-i18n:
    generated_at: "2026-04-30T09:34:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0525a71d3f08b7aa95e2f06acc6c23d87cd92d6b5fe4fc050ecf2b7caff84b3f
    source_path: auth-credential-semantics.md
    workflow: 16
---

Este documento define a elegibilidade canônica de credenciais e a semântica de resolução usadas em:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

O objetivo é manter alinhados o comportamento no momento da seleção e em tempo de execução.

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

1. Um perfil de token é inelegível quando tanto `token` quanto `tokenRef` estão ausentes.
2. `expires` é opcional.
3. Se `expires` estiver presente, ele deve ser um número finito maior que `0`.
4. Se `expires` for inválido (`NaN`, `0`, negativo, não finito ou tipo incorreto), o perfil é inelegível com `invalid_expires`.
5. Se `expires` estiver no passado, o perfil é inelegível com `expired`.
6. `tokenRef` não contorna a validação de `expires`.

### Regras de resolução

1. A semântica do resolvedor corresponde à semântica de elegibilidade para `expires`.
2. Para perfis elegíveis, o material do token pode ser resolvido a partir de valor inline ou de `tokenRef`.
3. Referências irresolvíveis produzem `unresolved_ref` na saída de `models status --probe`.

## Portabilidade de cópia de agente

A herança de autenticação do agente é de leitura passante. Quando um agente não tem perfil local, ele pode resolver perfis do armazenamento do agente padrão/principal em tempo de execução sem copiar material secreto para seu próprio `auth-profiles.json`.

Fluxos de cópia explícitos, como `openclaw agents add`, usam esta política de portabilidade:

- Perfis `api_key` são portáveis, a menos que `copyToAgents: false`.
- Perfis `token` são portáveis, a menos que `copyToAgents: false`.
- Perfis `oauth` não são portáveis por padrão porque tokens de atualização podem ser de uso único ou sensíveis à rotação.
- Fluxos de OAuth pertencentes a provedores podem optar por entrar com `copyToAgents: true` somente quando for comprovadamente seguro copiar material de atualização entre agentes.

Perfis não portáveis continuam disponíveis por meio da herança de leitura passante, a menos que o agente de destino faça login separadamente e crie seu próprio perfil local.

## Filtragem explícita de ordem de autenticação

- Quando `auth.order.<provider>` ou a substituição de ordem do armazenamento de autenticação estiver definida para um provedor, `models status --probe` sonda apenas IDs de perfil que permanecem na ordem de autenticação resolvida para esse provedor.
- Um perfil armazenado para esse provedor que é omitido da ordem explícita não é tentado silenciosamente depois. A saída da sondagem o relata com `reasonCode: excluded_by_auth_order` e o detalhe `Excluded by auth.order for this provider.`

## Resolução de alvo de sondagem

- Alvos de sondagem podem vir de perfis de autenticação, credenciais de ambiente ou `models.json`.
- Se um provedor tem credenciais, mas o OpenClaw não consegue resolver um candidato de modelo sondável para ele, `models status --probe` relata `status: no_model` com `reasonCode: no_model`.

## Descoberta de credenciais de CLI externa

- Credenciais somente de tempo de execução pertencentes a CLIs externas são descobertas apenas quando o provedor, o runtime ou o perfil de autenticação está no escopo da operação atual, ou quando um perfil local armazenado para essa fonte externa já existe.
- Caminhos somente leitura/de status passam `allowKeychainPrompt: false`; eles usam apenas credenciais de CLI externa respaldadas por arquivo e não leem nem reutilizam resultados do macOS Keychain.

## Proteção da política de SecretRef OAuth

- Entrada SecretRef é apenas para credenciais estáticas.
- Se uma credencial de perfil for `type: "oauth"`, objetos SecretRef não serão compatíveis com o material de credencial desse perfil.
- Se `auth.profiles.<id>.mode` for `"oauth"`, a entrada `keyRef`/`tokenRef` respaldada por SecretRef para esse perfil será rejeitada.
- Violações são falhas rígidas nos caminhos de resolução de autenticação de inicialização/recarregamento.

## Mensagens compatíveis com legado

Para compatibilidade de scripts, erros de sondagem mantêm esta primeira linha inalterada:

`Auth profile credentials are missing or expired.`

Detalhes amigáveis para humanos e códigos de motivo estáveis podem ser adicionados nas linhas subsequentes.

## Relacionados

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [Armazenamento de autenticação](/pt-BR/concepts/oauth)
