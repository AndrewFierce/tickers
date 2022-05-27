from flask import Flask, request, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

import pandas as pd

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://postgres:admin@localhost:5432/tickers"  # Connect SQLALCHEMY to PostgreSQL
db = SQLAlchemy(app)
migrate = Migrate(app, db)


class TickersModel(db.Model):
    """Ticker current state model"""
    __tablename__ = 'tickers'  # Table name

    id = db.Column(db.Integer, primary_key=True)  # object id
    ticker_name = db.Column(db.String())  # ticker name
    price = db.Column(db.Float())  # ticker price
    time = db.Column(db.DateTime())  # time

    def __init__(self, ticker_name, price, time):
        self.ticker_name = ticker_name
        self.price = price
        self.time = time

    def __repr__(self):
        return f""


class TickersModelHistory(db.Model):
    """Model of tickers state history"""
    __tablename__ = 'tickers_history'  # table name

    id = db.Column(db.Integer, primary_key=True)  # object id
    ticker_name = db.Column(db.String())  # ticker name
    price = db.Column(db.Float())  # ticker price
    time = db.Column(db.DateTime())  # time

    def __init__(self, ticker_name, price, time):
        self.ticker_name = ticker_name
        self.price = price
        self.time = time

    def __repr__(self):
        return f""


# Function of getting data from database and sending them to user interface
@app.route('/', methods=['POST', 'GET'])
def handle_tickers():
    if request.method == 'POST':
        ticker = request.form.get('ticker_name') or 'ticker_00'  # get ticker name
        if request.form.get('isData') == 'full_data':  # get all the information about current ticker
            df = pd.DataFrame(TickersModelHistory  # get information about the chosen ticker and insert it into pandas
                              .query.filter_by(ticker_name=ticker).with_entities(
                TickersModelHistory.price, TickersModelHistory.time).order_by(TickersModelHistory.time).all())
            return df.to_dict('index')  # convert the table into json
        elif request.form.get('isData') == 'new_data':  #  If we want to get only new price values and to update the current graph
            df = pd.DataFrame(TickersModelHistory  # Get the new information about the chosen ticker and insert it into pandas
                              .query.filter_by(ticker_name=ticker)
                              .filter(TickersModelHistory.time > request.form.get('last_time')).with_entities(
                TickersModelHistory.price, TickersModelHistory.time).order_by(TickersModelHistory.time).all())
            return df.to_dict('index')  # concert the table into json

    elif request.method == 'GET':
        tickers_name = TickersModel.query.with_entities(  # Get all tickers names
            TickersModel.ticker_name).order_by(TickersModel.ticker_name).all()
        responce = [value for (value,) in tickers_name]
        return render_template('tickers.html', context=responce)


if __name__ == '__main__':
    app.run()
