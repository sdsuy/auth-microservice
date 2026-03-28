class CircuitBreaker {
  constructor({ failureThreshold = 3, recoveryTime = 5000 } = {}) {
    this.failureThreshold = failureThreshold;
    this.recoveryTime = recoveryTime;

    this.failureCount = 0;
    this.state = "CLOSED";
    this.nextTry = Date.now();

    this.isTesting = false;
  }

  async execute(action) {
    if (this.state === "OPEN") {
      if (Date.now() > this.nextTry) {
        this.state = "HALF";
        this.isTesting = false;
        console.log("⚠️ Circuit HALF-OPEN: testing...");
      } else {
        throw new Error("Circuit is OPEN");
      }
    }

    // 👇 AQUÍ está el rate limiting
    if (this.state === "HALF") {
      if (this.isTesting) {
        throw new Error("Circuit is HALF-OPEN (waiting test result)");
      }
      this.isTesting = true;
    }

    try {
      const result = await action();

      this.success();
      this.isTesting = false;
      return result;

    } catch (err) {
      this.fail();
      this.isTesting = false;
      throw err;
    }
  }

  success() {
    this.failureCount = 0;

    if (this.state === "HALF") {
      console.log("✅ Circuit CLOSED again");
      this.state = "CLOSED";
    }
  }

  fail() {
    this.failureCount++;

    console.log(`❌ Failure count: ${this.failureCount}`);

    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      this.nextTry = Date.now() + this.recoveryTime;

      console.log("🔥 Circuit OPEN");
    }
  }
}

module.exports = CircuitBreaker;
