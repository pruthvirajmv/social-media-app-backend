const routeNotFound = (req, res) => {
    res.status(404).json({success:false, message: "No route found"});
  }
  
module.exports = routeNotFound;