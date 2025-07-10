const apiKeyInput = document.getElementById('apiKey')
const gameSelect = document.getElementById('gameSelect')
const questionInput = document.getElementById('questionInput')
const askButton = document.getElementById('askButton')
const aiResponse = document.getElementById('aiResponse')
const form = document.getElementById('form')

const markdownToHTML = (text) => {
    const converter = new showdown.Converter()
    return converter.makeHtml(text)
}

const perguntarAI = async (question, game, apiKey) => {
    const model = "gemini-2.0-flash"
    const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const perguntaLOL = `
## Especialidade
Você é um especialista assistente de meta para o jogo League of Legends.

## Tarefa
Você deve responder as perguntas do usuário com base no seu conhecimento sobre o jogo, estratégias, builds e dicas.

## Regras
- Se não souber, responda "Não sei".
- Se não for relacionado ao jogo, diga "Essa pergunta não está relacionada ao jogo".
- Use a data de hoje: ${new Date().toLocaleDateString()}
- Use informações atualizadas do patch atual.
- Nunca invente conteúdo.

## Resposta
- Seja direto. Máximo 200 caracteres.
- Use markdown.
- Sem saudações ou despedidas.

## Exemplo de resposta
**Itens:** [Exemplo de build atual]\n**Runas:** [Runas sugeridas]

Pergunta: ${question}
`

    const perguntaValorant = `
## Especialidade
Você é um especialista tático e estratégico em Valorant.

## Tarefa
Responda sobre agentes, estratégias, mapas, economia e dicas de jogo.

## Regras
- Se não souber, diga "Não sei".
- Se não for sobre Valorant, diga "Essa pergunta não está relacionada ao jogo".
- Data: ${new Date().toLocaleDateString()}
- Use conhecimento do patch atual.

## Resposta
- Direto, até 200 caracteres.
- Em markdown.
- Sem saudações.

## Exemplo de resposta
**Melhor agente para Fracture:** Use Breach por causa do controle em áreas apertadas.\n**Dica:** Priorize controle de ultimates por orbes.

Pergunta: ${question}
`

    const perguntaCS = `
## Especialidade
Você é um analista estratégico de CS: GO.

## Tarefa
Dê dicas sobre mira, mapas, táticas de time, economia e posições.

## Regras
- Se não souber, diga "Não sei".
- Se não for sobre CS:GO, diga "Essa pergunta não está relacionada ao jogo".
- Data: ${new Date().toLocaleDateString()}
- Use conhecimento da meta atual.

## Resposta
- Máx. 200 caracteres.
- Use markdown.
- Sem saudações.

## Exemplo de resposta
**Dica de economia:** Após perder pistol, compre pistolas e utilitários no round 2 para "force buy".\n**Mapa:** Em Mirage, jogue passivo no CT inicial.

Pergunta: ${question}
`

    let pergunta = ''

    if (game === 'LOL') {
        pergunta = perguntaLOL
    } else if (game === 'Valorant') {
        pergunta = perguntaValorant
    } else if (game === 'CS:GO') {
        pergunta = perguntaCS
    } else {
        throw new Error('Jogo não reconhecido')
    }

    const contents = [{
        role: "user",
        parts: [{
            text: pergunta
        }]
    }]

    const tools = [
        {
            google_search: {} // Mantido para todos os jogos
        }
    ]

    const response = await fetch(geminiURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents,
            tools
        })
    })

    const data = await response.json()
    return data.candidates[0].content.parts[0].text
}

const enviarFormulario = async (event) => {
    event.preventDefault()
    const apiKey = apiKeyInput.value
    const game = gameSelect.value
    const question = questionInput.value

    if (apiKey === '' || game === '' || question === '') {
        alert('Por favor, preencha todos os campos')
        return
    }

    askButton.disabled = true
    askButton.textContent = 'Perguntando...'
    askButton.classList.add('loading')

    try {
        const text = await perguntarAI(question, game, apiKey)
        aiResponse.querySelector('.response-content').innerHTML = markdownToHTML(text)
        aiResponse.classList.remove('hidden')
    } catch (error) {
        console.log('Erro: ', error)
    } finally {
        askButton.disabled = false
        askButton.textContent = "Perguntar"
        askButton.classList.remove('loading')
    }
}

form.addEventListener('submit', enviarFormulario)
