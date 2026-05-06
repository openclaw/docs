---
read_when:
    - Você precisa fazer login em sites para automação de navegador
    - Você quer publicar atualizações no X/Twitter
summary: Logins manuais para automação de navegador + publicação no X/Twitter
title: Login pelo navegador
x-i18n:
    generated_at: "2026-05-06T09:15:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 235194fd3a49724247f98e6d7c848c4cc3317f749ff4a8918c2172b73baf21e3
    source_path: tools/browser-login.md
    workflow: 16
---

## Login manual (recomendado)

Quando um site exigir login, **entre manualmente** no perfil do navegador **host** (o navegador openclaw).

**Não** forneça suas credenciais ao modelo. Logins automatizados costumam acionar defesas anti-bot e podem bloquear a conta.

Voltar à documentação principal do navegador: [Navegador](/pt-BR/tools/browser).

## Qual perfil do Chrome é usado?

O OpenClaw controla um **perfil dedicado do Chrome** (chamado `openclaw`, com interface em tons de laranja). Ele é separado do seu perfil de navegador diário.

Para chamadas de ferramenta de navegador do agente:

- Escolha padrão: o agente deve usar seu navegador `openclaw` isolado.
- Use `profile="user"` somente quando sessões já autenticadas forem importantes e o usuário estiver no computador para clicar/aprovar qualquer prompt de anexação.
- Se você tiver vários perfis de navegador do usuário, especifique o perfil explicitamente em vez de adivinhar.

Duas formas fáceis de acessá-lo:

1. **Peça ao agente para abrir o navegador** e então faça login você mesmo.
2. **Abra-o pela CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Se você tiver vários perfis, passe `--browser-profile <name>` (o padrão é `openclaw`).

## X/Twitter: fluxo recomendado

- **Ler/buscar/sequências:** use o navegador **host** (login manual).
- **Publicar atualizações:** use o navegador **host** (login manual).

## Sandbox + acesso ao navegador host

Sessões de navegador em sandbox têm **maior probabilidade** de acionar detecção de bots. Para X/Twitter (e outros sites rigorosos), prefira o navegador **host**.

Se o agente estiver em sandbox, a ferramenta de navegador usa a sandbox por padrão. Para permitir controle do host:

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

Então direcione para o navegador host:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Ou desative a sandbox para o agente que publica atualizações.

## Relacionados

- [Navegador](/pt-BR/tools/browser)
- [Solução de problemas do navegador no Linux](/pt-BR/tools/browser-linux-troubleshooting)
- [Solução de problemas do navegador no WSL2](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
