---
read_when:
    - Executando scripts do repositório
    - Adicionando ou alterando scripts em ./scripts
summary: 'Scripts do repositório: finalidade, escopo e observações de segurança'
title: Scripts
x-i18n:
    generated_at: "2026-04-24T05:55:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d76777402670abe355b9ad2a0337f96211af1323e36f2ab1ced9f04f87083f5
    source_path: help/scripts.md
    workflow: 15
---

O diretório `scripts/` contém scripts auxiliares para workflows locais e tarefas operacionais.
Use-os quando uma tarefa estiver claramente ligada a um script; caso contrário, prefira a CLI.

## Convenções

- Scripts são **opcionais**, a menos que sejam referenciados na documentação ou em checklists de release.
- Prefira superfícies da CLI quando elas existirem (exemplo: monitoramento de autenticação usa `openclaw models status --check`).
- Presuma que scripts sejam específicos do host; leia-os antes de executá-los em uma nova máquina.

## Scripts de monitoramento de autenticação

O monitoramento de autenticação é coberto em [Autenticação](/pt-BR/gateway/authentication). Os scripts em `scripts/` são extras opcionais para workflows com systemd/Termux em telefone.

## Helper de leitura do GitHub

Use `scripts/gh-read` quando quiser que `gh` use um token de instalação do GitHub App para chamadas de leitura com escopo de repositório, enquanto mantém o `gh` normal com seu login pessoal para ações de escrita.

Variáveis de ambiente obrigatórias:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Variáveis de ambiente opcionais:

- `OPENCLAW_GH_READ_INSTALLATION_ID` quando você quiser pular a busca de instalação baseada em repositório
- `OPENCLAW_GH_READ_PERMISSIONS` como substituição separada por vírgulas para o subconjunto de permissões de leitura a solicitar

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
- Adicione uma entrada curta na documentação relevante (ou crie uma se estiver faltando).

## Relacionado

- [Testes](/pt-BR/help/testing)
- [Testes live](/pt-BR/help/testing-live)
