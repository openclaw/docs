---
read_when:
    - Você precisa fazer login em sites para automação de navegador
    - Você quer publicar atualizações no X/Twitter
summary: Logins manuais para automação de navegador + publicação no X/Twitter
title: Login no navegador
x-i18n:
    generated_at: "2026-04-24T06:14:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e70ae373fed861ffde0e03dfe6252b0589f7cc1946585e9b055cbed70de14b1
    source_path: tools/browser-login.md
    workflow: 15
---

# Login no navegador + publicação no X/Twitter

## Login manual (recomendado)

Quando um site exigir login, **faça login manualmente** no perfil de navegador **host** (o navegador openclaw).

**Não** forneça suas credenciais ao modelo. Logins automatizados frequentemente acionam defesas anti-bot e podem bloquear a conta.

Voltar para a documentação principal do navegador: [Browser](/pt-BR/tools/browser).

## Qual perfil do Chrome é usado?

O OpenClaw controla um **perfil dedicado do Chrome** (chamado `openclaw`, interface com tom alaranjado). Ele é separado do seu perfil de navegador do dia a dia.

Para chamadas da ferramenta de navegador pelo agente:

- Escolha padrão: o agente deve usar seu navegador `openclaw` isolado.
- Use `profile="user"` apenas quando sessões existentes autenticadas importarem e o usuário estiver no computador para clicar/aprovar qualquer prompt de anexação.
- Se você tiver vários perfis de navegador de usuário, especifique o perfil explicitamente em vez de adivinhar.

Duas formas fáceis de acessá-lo:

1. **Peça ao agente para abrir o navegador** e depois faça login você mesmo.
2. **Abra-o via CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Se você tiver vários perfis, passe `--browser-profile <name>` (o padrão é `openclaw`).

## X/Twitter: fluxo recomendado

- **Ler/pesquisar/threads:** use o navegador **host** (login manual).
- **Publicar atualizações:** use o navegador **host** (login manual).

## Sandboxing + acesso ao navegador do host

Sessões de navegador em sandbox são **mais propensas** a acionar detecção de bot. Para X/Twitter (e outros sites rigorosos), prefira o navegador **host**.

Se o agente estiver em sandbox, a ferramenta de navegador usará o sandbox por padrão. Para permitir controle do host:

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

Depois direcione ao navegador do host:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Ou desative o sandboxing para o agente que publica atualizações.

## Relacionado

- [Browser](/pt-BR/tools/browser)
- [Solução de problemas do browser no Linux](/pt-BR/tools/browser-linux-troubleshooting)
- [Solução de problemas do browser no WSL2](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
