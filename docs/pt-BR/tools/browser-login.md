---
read_when:
    - Você precisa fazer login em sites para automação do navegador
    - Você quer publicar atualizações no X/Twitter
summary: Logins manuais para automação do navegador + publicação no X/Twitter
title: Login pelo navegador
x-i18n:
    generated_at: "2026-07-12T00:25:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## Login manual (recomendado)

Quando um site exigir login, entre manualmente no perfil `openclaw` do navegador
do host. Não forneça suas credenciais ao modelo: logins automatizados costumam
acionar defesas contra bots e podem bloquear a conta.

Use o navegador do host (login manual) tanto para leitura (pesquisas/tópicos)
quanto para publicações no X/Twitter e em outros sites sensíveis a bots. Sessões
de navegador em sandbox têm maior probabilidade de acionar a detecção de bots.

Voltar para a documentação principal do navegador: [Navegador](/pt-BR/tools/browser).

## Qual perfil do Chrome é usado?

O OpenClaw controla um perfil dedicado do Chrome chamado `openclaw` (interface
com tonalidade laranja), separado do seu perfil de navegador habitual.

Para chamadas da ferramenta de navegador pelo agente:

- Opção padrão: o agente usa seu navegador `openclaw` isolado.
- Use `profile="user"` somente quando as sessões existentes com login forem
  importantes e você estiver no computador para clicar/aprovar qualquer
  solicitação de conexão.
- Se você tiver vários perfis de usuário no navegador, especifique o perfil
  explicitamente em vez de tentar adivinhar.

Há duas formas de acessar o perfil `openclaw`:

1. Peça ao agente para abrir o navegador e, em seguida, faça login você mesmo.
2. Abra-o pela CLI:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Para um perfil que não seja o padrão, coloque `--browser-profile <name>` antes
do subcomando (o padrão é `openclaw`):

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## Sandbox: permitir acesso ao navegador do host

Se o agente estiver em sandbox, as chamadas à ferramenta `browser` usarão por
padrão o navegador da sandbox, não o do host. Para permitir que o agente use o
navegador do host:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

As invocações pela CLI sempre usam o navegador do host, nunca o da sandbox,
portanto você pode abrir o navegador do host por conta própria,
independentemente dessa configuração:

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

Depois que `sandbox.browser.allowHostControl: true` for definido, as chamadas do
agente à ferramenta `browser` também poderão usar o host. Como alternativa,
desative a sandbox para o agente que publica atualizações.

## Relacionados

- [Navegador](/pt-BR/tools/browser)
- [Solução de problemas do navegador no Linux](/pt-BR/tools/browser-linux-troubleshooting)
- [Solução de problemas do navegador no WSL2](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
