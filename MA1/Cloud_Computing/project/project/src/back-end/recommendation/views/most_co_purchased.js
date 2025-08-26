const viewDescriptor = {
  views: {
    most_co_purchased: {
      map: function (doc) {
        if (doc.details && doc.details.checkout && Array.isArray(doc.details.checkout.items)) {
          const items = doc.details.checkout.items;
          for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
              emit(items[i].name, items[j].name);
              emit(items[j].name, items[i].name);
            }
          }
        }
      },
      reduce: function (keys, values, rereduce) {
        const result = {};
        if (rereduce) {
          for (const value of values) {
            for (const product in value) {
              result[product] = (result[product] || 0) + value[product];
            }
          }
        } else {
          for (const product of values) {
            result[product] = (result[product] || 0) + 1;
          }
        }
        return result;
      }
    }
  }
};

module.exports = { viewDescriptor };