---
x-i18n:
    generated_at: "2026-06-27T17:08:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c67d049eb1d0f1d4e675a71e69b2d34d3ce5c733ca9582bf08ac717c233644
    source_path: AGENTS.md
    workflow: 16
---

# Guia de documentação

Este diretório é responsável pela autoria da documentação, pelas regras de links do Mintlify e pela política de i18n da documentação.

## Regras do Mintlify

- A documentação é hospedada no Mintlify (`https://docs.openclaw.ai`).
- Links internos de documentação em `docs/**/*.md` devem permanecer relativos à raiz, sem sufixo `.md` ou `.mdx` (exemplo: `[Config](/gateway/configuration)`).
- Referências cruzadas de seção devem usar âncoras em caminhos relativos à raiz (exemplo: `[Hooks](/gateway/configuration-reference#hooks)`).
- Títulos da documentação devem evitar travessões e apóstrofos porque a geração de âncoras do Mintlify é frágil nesses casos.
- README e outras documentações renderizadas pelo GitHub devem manter URLs absolutas da documentação para que os links funcionem fora do Mintlify.
- O conteúdo da documentação deve permanecer genérico: sem nomes de dispositivos pessoais, hostnames ou caminhos locais; use placeholders como `user@gateway-host`.

## Regras de conteúdo da documentação

- Para documentação, textos de UI e listas de seleção, ordene serviços/provedores alfabeticamente, a menos que a seção descreva explicitamente a ordem de runtime ou a ordem de detecção automática.
- Mantenha a nomenclatura de Plugin incluído consistente com as regras de terminologia de Plugin em todo o repositório no `AGENTS.md` raiz.

## Documentação interna

- Documentação privada duradoura de operadores pertence a `~/Projects/manager/docs/`.
- Documentação interna local do repositório para rascunho/espelhamento pode ficar sob `docs/internal/` ignorado.
- Nunca adicione páginas `docs/internal/**` à navegação de `docs/docs.json` nem crie links para elas a partir da documentação pública.
- `scripts/docs-sync-publish.mjs` exclui e remove `docs/internal/**` do repositório público de publicação `openclaw/docs` se uma página for adicionada à força depois.
- A documentação interna pode mencionar caminhos do repositório, nomes de apps privados, nomes de itens do 1Password e runbooks, mas nunca incluir valores secretos.

## Edição do scorecard de maturidade

`taxonomy.yaml` e `qa/maturity-scores.yaml` são as entradas de origem; a documentação de maturidade gerada em `docs/maturity/` é uma projeção e não deve ser editada manualmente para pontuação, LTS, taxonomia, perfil de QA ou tabelas de evidências.
`scripts/qa/render-maturity-docs.ts` é responsável pela geração; use `pnpm maturity:render` para atualizar a documentação versionada e `pnpm maturity:check` para verificá-la.
`.github/workflows/maturity-scorecard.yml` renderiza prévias de artefatos e pode abrir PRs de documentação gerada; `.github/workflows/openclaw-release-checks.yml` a despacha para QA de release.
Mantenha dados determinísticos de `qa-evidence.json.scorecard` em artefatos do GitHub Actions, a menos que um mantenedor peça explicitamente uma projeção sanitizada e versionada.
Substituições humanas devem alterar o estado de origem em um PR e explicar o motivo mais evidências públicas ou redigidas.

## i18n da documentação

- Documentação em idiomas estrangeiros não é mantida neste repositório. A saída de publicação gerada fica no repositório separado `openclaw/docs` (frequentemente clonado localmente como `../openclaw-docs`).
- Não adicione nem edite documentação localizada em `docs/<locale>/**` aqui.
- Trate a documentação em inglês neste repositório, mais os arquivos de glossário, como a fonte da verdade.
- Pipeline: atualize a documentação em inglês aqui, atualize `docs/.i18n/glossary.<locale>.json` conforme necessário e então deixe a sincronização do repositório de publicação e `scripts/docs-i18n` rodarem em `openclaw/docs`.
- Antes de executar novamente `scripts/docs-i18n`, adicione entradas de glossário para quaisquer novos termos técnicos, títulos de páginas ou rótulos curtos de navegação que devam permanecer em inglês ou usar uma tradução fixa.
- `pnpm docs:check-i18n-glossary` é a proteção para títulos alterados da documentação em inglês e rótulos curtos de documentação interna.
- A memória de tradução fica em arquivos gerados `docs/.i18n/*.tm.jsonl` no repositório de publicação.
- Consulte `docs/.i18n/README.md`.
