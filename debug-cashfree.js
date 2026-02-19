const cashfreePkg = require("cashfree-pg");
const { Cashfree } = cashfreePkg;

console.log("CashfreePkg keys:", Object.keys(cashfreePkg));

if (Cashfree) {
    console.log("Cashfree is defined");
    console.log("Is PGCreateOrder on Cashfree (static)?", "PGCreateOrder" in Cashfree);
    console.log("Is PGCreateOrder on Cashfree.prototype?", "PGCreateOrder" in Cashfree.prototype);

    try {
        const instance = new Cashfree(
            "SANDBOX",
            "dummy",
            "dummy"
        );
        console.log("Instance created");
        console.log("Is PGCreateOrder on instance?", "PGCreateOrder" in instance);
    } catch (e) {
        console.log("Instance creation failed:", e.message);
    }
} else {
    console.log("Cashfree is NOT exported");
}

