---
read_when:
    - Trabalhando na resolução de perfis de autenticação ou no roteamento de credenciais
    - Depurando falhas de autenticação do modelo ou a ordem dos perfis
summary: Semântica canônica de elegibilidade de credenciais e resolução para perfis de autenticação
title: Semântica de credenciais de autenticação
x-i18n:
    generated_at: "2026-04-24T05:40:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: b45da872b9ab177acbac08ce353b6ee31b6a068477ace52e5e5eda32a848d8bb
    source_path: auth-credential-semantics.md
    workflow: 15
---

Este documento define a semântica canônica de elegibilidade de credenciais e resolução usada em:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

O objetivo é manter alinhado o comportamento no momento da seleção e em tempo de execução.

## Códigos de motivo estáveis para probe

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

1. Um perfil de token é inelegível quando `token` e `tokenRef` estão ambos ausentes.
2. `expires` é opcional.
3. Se `expires` estiver presente, deve ser um número finito maior que `0`.
4. Se `expires` for inválido (`NaN`, `0`, negativo, não finito ou do tipo errado), o perfil é inelegível com `invalid_expires`.
5. Se `expires` estiver no passado, o perfil é inelegível com `expired`.
6. `tokenRef` não contorna a validação de `expires`.

### Regras de resolução

1. A semântica do resolvedor corresponde à semântica de elegibilidade para `expires`.
2. Para perfis elegíveis, o material do token pode ser resolvido a partir do valor inline ou de `tokenRef`.
3. Referências que não podem ser resolvidas produzem `unresolved_ref` na saída de `models status --probe`.

## Filtragem explícita da ordem de autenticação

- Quando `auth.order.<provider>` ou a substituição da ordem do armazenamento de autenticação é definida para um provider, `models status --probe` faz probe apenas dos IDs de perfil que permanecem na ordem de autenticação resolvida para esse provider.
- Um perfil armazenado para esse provider que for omitido da ordem explícita não será tentado silenciosamente depois. A saída do probe o informa com `reasonCode: excluded_by_auth_order` e o detalhe `Excluded by auth.order for this provider.`

## Resolução do alvo do probe

- Os alvos do probe podem vir de perfis de autenticação, credenciais de ambiente ou `models.json`.
- Se um provider tiver credenciais, mas o OpenClaw não conseguir resolver um candidato de modelo utilizável para probe, `models status --probe` informa `status: no_model` com `reasonCode: no_model`.

## Proteção de política de OAuth SecretRef

- A entrada SecretRef é apenas para credenciais estáticas.
- Se uma credencial de perfil for `type: "oauth"`, objetos SecretRef não são suportados para o material de credencial desse perfil.
- Se `auth.profiles.<id>.mode` for `"oauth"`, a entrada `keyRef`/`tokenRef` com SecretRef para esse perfil será rejeitada.
- Violações são falhas fatais nos caminhos de resolução de autenticação durante inicialização/recarregamento.

## Mensagens compatíveis com legado

Para compatibilidade com scripts, os erros de probe mantêm esta primeira linha inalterada:

`Auth profile credentials are missing or expired.`

Detalhes mais amigáveis para humanos e códigos de motivo estáveis podem ser adicionados nas linhas seguintes.

## Relacionado

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [Armazenamento de autenticação](/pt-BR/concepts/oauth)
