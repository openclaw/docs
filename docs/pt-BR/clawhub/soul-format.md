---
read_when:
    - Publicando almas
    - Depuração de falhas de publicação do soul
summary: Formato do pacote Soul, arquivos obrigatórios, limites.
x-i18n:
    generated_at: "2026-05-12T08:44:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Formato de soul

## No disco

Uma soul é um único arquivo:

- `SOUL.md` (ou `soul.md`)

Por enquanto, onlycrabs.ai rejeita quaisquer arquivos extras.

## `SOUL.md`

- Markdown com frontmatter YAML opcional.
- O servidor extrai metadados do frontmatter durante a publicação.
- `description` é usado como o resumo da soul na UI/pesquisa.

## Limites

- Tamanho total do pacote: 50 MB.
- O texto de incorporação inclui apenas `SOUL.md`.

## Slugs

- Derivados do nome da pasta por padrão.
- Devem estar em letras minúsculas e ser seguros para URL: `^[a-z0-9][a-z0-9-]*$`.

## Versionamento + tags

- Cada publicação cria uma nova versão (semver).
- Tags são ponteiros de string para uma versão; `latest` é comumente usado.
