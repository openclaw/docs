---
read_when:
    - Ao executar scripts do repositório
    - Ao adicionar ou alterar scripts em ./scripts
summary: 'Scripts do repositório: finalidade, escopo e observações de segurança'
title: Scripts
x-i18n:
    generated_at: "2026-04-08T02:15:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ecf1e9327929948fb75f80e306963af49b353c0aa8d3b6fa532ca964ff8b975
    source_path: help/scripts.md
    workflow: 15
---

# Scripts

O diretório `scripts/` contém scripts auxiliares para fluxos de trabalho locais e tarefas operacionais.
Use-os quando uma tarefa estiver claramente vinculada a um script; caso contrário, prefira a CLI.

## Convenções

- Os scripts são **opcionais**, a menos que sejam referenciados na documentação ou em checklists de release.
- Prefira superfícies da CLI quando elas existirem (exemplo: o monitoramento de autenticação usa `openclaw models status --check`).
- Considere que os scripts são específicos do host; leia-os antes de executá-los em uma nova máquina.

## Scripts de monitoramento de autenticação

O monitoramento de autenticação é abordado em [Autenticação](/pt-BR/gateway/authentication). Os scripts em `scripts/` são extras opcionais para fluxos de trabalho com systemd/Termux em telefone.

## Helper de leitura do GitHub

Use `scripts/gh-read` quando quiser que o `gh` use um token de instalação do GitHub App para chamadas de leitura com escopo de repositório, enquanto mantém o `gh` normal na sua conta pessoal para ações de escrita.

Variáveis de ambiente obrigatórias:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Variáveis de ambiente opcionais:

- `OPENCLAW_GH_READ_INSTALLATION_ID` quando você quiser ignorar a busca da instalação com base no repositório
- `OPENCLAW_GH_READ_PERMISSIONS` como uma substituição separada por vírgulas para o subconjunto de permissões de leitura a solicitar

Ordem de resolução do repositório:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Exemplos:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Ao adicionar scripts

- Mantenha os scripts focados e documentados.
- Adicione uma entrada curta na documentação relevante (ou crie uma, se estiver faltando).
