module.exports = [
[
  {
    "key": "tag",
    "type": "string",
    "access": "system",
    "value": "Button"
  },
  {
    "key": "name",
    "type": "string",
    "access": "system",
    "value": "Button 1.0"
  },
  {
    "key": "category",
    "type": "array",
    "access": "system",
    "value": ["General", "Buttons"]
  },
  {
    "key": "color",
    "type": "dropdown",
    "value": "red",
    "access": "public",
    "title": "Color",
    "options": {
      "data": "colors"
    }
  }
]];