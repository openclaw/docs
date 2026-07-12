---
read_when:
    - Você quer configurar o ID do provedor qwen-oauth
    - Você usou anteriormente credenciais OAuth do Qwen Portal
    - Você precisa do endpoint do Qwen Portal ou de orientações sobre migração
summary: Use o ID do provedor Qwen Portal com o OpenClaw
title: OAuth / Portal do Qwen
x-i18n:
    generated_at: "2026-07-12T15:34:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` é o id do provedor Qwen Portal, registrado pelo plugin Qwen
(`@openclaw/qwen-provider`). Ele é direcionado ao endpoint do Qwen Portal em
`https://portal.qwen.ai/v1` e mantém configurações antigas do Qwen OAuth / portal
acessíveis por meio de um id de provedor distinto, separado do provedor
canônico `qwen`.

Escolha `qwen-oauth` se você já tiver um token funcional do Qwen Portal, estiver
migrando um fluxo legado do Qwen OAuth ou Qwen CLI, ou precisar testar
especificamente o endpoint do Qwen Portal. Para novas configurações, prefira
[Qwen](/pt-BR/providers/qwen) com o endpoint Standard do ModelStudio: ele abrange novas
configurações com chave de API, mais opções de endpoint, o Standard com pagamento
conforme o uso, o Coding Plan e o catálogo completo do plugin Qwen.

## Configuração

Instale o plugin Qwen caso ainda não o tenha instalado:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

Forneça seu token do portal por meio da integração inicial:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Execuções não interativas leem o token de `--qwen-oauth-token <token>` ou defina:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

A integração inicial armazena o token em um perfil de autenticação `qwen-oauth`,
inicializa o catálogo de modelos do portal e define
`qwen-oauth/qwen3.5-plus` como o modelo padrão quando nenhum estiver configurado.

## Padrões

- Provedor: `qwen-oauth`
- Aliases: `qwen-portal`, `qwen-cli`
- URL base: `https://portal.qwen.ai/v1`
- Variável de ambiente: `QWEN_API_KEY`
- Estilo da API: compatível com OpenAI
- Modelo padrão: `qwen-oauth/qwen3.5-plus`

## Diferenças em relação ao Qwen

O OpenClaw tem dois ids de provedor voltados ao Qwen:

| Provedor     | Família de endpoints                                      | Mais indicado para                                                                                                     |
| ------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `qwen`       | Endpoints do Qwen Cloud / Alibaba DashScope e Coding Plan | Novas configurações com chave de API, Standard com pagamento conforme o uso, Coding Plan e recursos multimodais do DashScope |
| `qwen-oauth` | Endpoint do Qwen Portal em `portal.qwen.ai/v1`            | Tokens existentes do Qwen Portal e configurações legadas do Qwen OAuth / CLI                                           |

Ambos os provedores usam formatos de solicitação compatíveis com OpenAI, mas são
superfícies de autenticação separadas. Um token armazenado para `qwen-oauth` não
deve ser tratado como uma chave do DashScope ou ModelStudio, e uma nova chave do
DashScope deve usar o provedor canônico `qwen`.

## Modelos

O plugin Qwen inicializa este catálogo estático para o endpoint do Qwen Portal.
Todas as entradas usam uma saída máxima de 65.536 tokens; a disponibilidade
depende da conta e do token atuais do Qwen Portal.

| Referência do modelo               | Entrada      | Contexto  | Observações   |
| ---------------------------------- | ------------ | --------- | ------------- |
| `qwen-oauth/qwen3.5-plus`          | texto, imagem | 1.000.000 | Modelo padrão |
| `qwen-oauth/qwen3.6-plus`          | texto, imagem | 1.000.000 |               |
| `qwen-oauth/qwen3-max-2026-01-23`  | texto         | 262.144   |               |
| `qwen-oauth/qwen3-coder-next`      | texto         | 262.144   |               |
| `qwen-oauth/qwen3-coder-plus`      | texto         | 1.000.000 |               |
| `qwen-oauth/MiniMax-M2.5`          | texto         | 1.000.000 | Raciocínio    |
| `qwen-oauth/glm-5`                 | texto         | 202.752   |               |
| `qwen-oauth/glm-4.7`               | texto         | 202.752   |               |
| `qwen-oauth/kimi-k2.5`             | texto, imagem | 262.144   |               |

Se sua conta usar chaves de API do ModelStudio / DashScope, configure o provedor
canônico `qwen`:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migração

Perfis legados do Qwen Portal OAuth não podem ser atualizados; o
`openclaw doctor` os sinaliza. Se um perfil do portal parar de funcionar, execute
novamente a integração inicial com um token atual ou mude para o provedor Qwen
Standard:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

O ModelStudio global Standard usa:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Solução de problemas

- Falhas na atualização do OAuth do portal: perfis legados do Qwen Portal OAuth
  não podem ser atualizados. Execute novamente a integração inicial com um token
  atual.
- Erros de endpoint incorreto: confirme que a referência do modelo começa com
  `qwen-oauth/` ao usar um token do portal. Use referências `qwen/` somente para
  o provedor canônico Qwen.
- Confusão com `QWEN_API_KEY`: ambas as páginas do Qwen mencionam essa variável
  de ambiente, mas a integração inicial armazena as credenciais no id do provedor
  selecionado. Prefira a integração inicial quando mantiver `qwen` e
  `qwen-oauth` disponíveis na mesma máquina.

## Relacionados

- [Qwen](/pt-BR/providers/qwen)
- [Alibaba Model Studio](/pt-BR/providers/alibaba)
- [Provedores de modelos](/pt-BR/concepts/model-providers)
- [Todos os provedores](/pt-BR/providers/index)
