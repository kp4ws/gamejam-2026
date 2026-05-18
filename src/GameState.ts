interface State {
    score: number;
    health: number;
    reset: () => void;
}

const GameState: State = {
    score: 0,
    health: 3,
    reset() {
        this.score = 0;
        this.health = 0;
    },
};

export default GameState