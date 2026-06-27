---
read_when:
    - Você quer configurar o ID do provedor qwen-oauth
    - Você usou anteriormente credenciais OAuth do Qwen Portal
    - Você precisa do endpoint do Qwen Portal ou de orientação de migração
summary: Use o ID do provedor Qwen Portal com o OpenClaw
title: Qwen OAuth / Portal
x-i18n:
    generated_at: "2026-06-27T18:06:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` é o id do provedor Qwen Portal. Ele direciona para o endpoint do Qwen Portal
e mantém configurações antigas do Qwen OAuth / portal endereçáveis por meio de um id de
provedor distinto.

Use este provedor quando você tiver especificamente um token atual do Qwen Portal para
`https://portal.qwen.ai/v1`, ou quando estiver migrando uma configuração mais antiga do Qwen Portal /
Qwen CLI e quiser manter essas credenciais separadas do provedor canônico
Qwen Cloud. Ele não é a primeira opção recomendada para novos usuários do Qwen.

Para novas configurações do Qwen Cloud, prefira [Qwen](/pt-BR/providers/qwen) com o endpoint Standard
do ModelStudio, a menos que você tenha especificamente um token atual do Qwen Portal.

## Configuração

Forneça seu token do portal durante o onboarding:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Ou defina:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## Padrões

- Provedor: `qwen-oauth`
- Aliases: `qwen-portal`, `qwen-cli`
- URL base: `https://portal.qwen.ai/v1`
- Var. de ambiente: `QWEN_API_KEY`
- Estilo da API: compatível com OpenAI
- Modelo padrão: `qwen-oauth/qwen3.5-plus`

## Como isso difere do Qwen

O OpenClaw tem dois ids de provedor voltados ao Qwen:

| Provedor     | Família de endpoints                                    | Ideal para                                                                              |
| ------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `qwen`       | Endpoints Qwen Cloud / Alibaba DashScope e Coding Plan   | Novas configurações com chave de API, Standard pago conforme o uso, Coding Plan, recursos multimodais do DashScope |
| `qwen-oauth` | Endpoint Qwen Portal em `portal.qwen.ai/v1`              | Tokens existentes do Qwen Portal e configurações legadas do Qwen OAuth / CLI            |

Ambos os provedores usam formatos de solicitação compatíveis com OpenAI, mas são superfícies
de autenticação separadas. Um token armazenado para `qwen-oauth` não deve ser tratado como uma chave
DashScope ou ModelStudio, e uma nova chave DashScope deve usar o provedor canônico `qwen`
em vez disso.

## Quando escolher Qwen OAuth / Portal

- Você já tem um token funcional do Qwen Portal.
- Você está preservando um fluxo de trabalho legado do Qwen OAuth ou Qwen CLI enquanto migra para
  o modelo de provedores do OpenClaw.
- Você precisa testar compatibilidade especificamente com o endpoint do Qwen Portal.

Escolha [Qwen](/pt-BR/providers/qwen) para nova configuração, opções mais amplas de endpoints, Standard
ModelStudio, Coding Plan e o catálogo completo de plugins do Qwen.

## Modelos

O catálogo do plugin Qwen define o padrão do Qwen Portal:

- `qwen-oauth/qwen3.5-plus`

A disponibilidade depende da conta e do token atuais do Qwen Portal. Se sua
conta usa chaves de API ModelStudio / DashScope, configure o provedor canônico
`qwen`:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migração

Perfis legados do Qwen Portal OAuth podem não ser atualizáveis. Se um perfil do portal
parar de funcionar, autentique novamente com um token atual ou mude para o provedor Standard
do Qwen:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

O ModelStudio global Standard usa:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Solução de problemas

- Falhas de atualização do Portal OAuth: perfis legados do Qwen Portal OAuth podem não ser
  atualizáveis. Execute o onboarding novamente com um token atual.
- Erros de endpoint incorreto: confirme que a referência do modelo começa com `qwen-oauth/` ao
  usar um token do portal. Use referências `qwen/` somente para o provedor canônico Qwen.
- Confusão com `QWEN_API_KEY`: ambas as páginas do Qwen mencionam essa var. de ambiente, mas o onboarding
  armazena credenciais sob o id do provedor selecionado. Prefira o onboarding quando você
  mantiver `qwen` e `qwen-oauth` disponíveis na mesma máquina.

## Relacionados

- [Qwen](/pt-BR/providers/qwen)
- [Alibaba Model Studio](/pt-BR/providers/alibaba)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
- [Todos os provedores](/pt-BR/providers/index)
